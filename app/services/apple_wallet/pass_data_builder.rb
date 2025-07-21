require 'jwt'
require 'base64'

module AppleWallet
  class PassDataBuilder
    SECRET_KEY = Rails.application.credentials.secret_key_base || ENV['SECRET_KEY_BASE']

    def self.build(participant:, nfc_message: nil, nfc_encryption_public_key: nil)
      event = participant.event

      # Payload for JWT (no expiry)
      payload = {
        participant_id: participant.id,
        event_id: event.id
      }

      token = JWT.encode(payload, SECRET_KEY, 'HS256')

      pass = {
        serialNumber: token,
        description: "#{event.name} Pass",
        organizationName: "Youthacks",
        passTypeIdentifier: ENV.fetch("PASS_TYPE_IDENTIFIER"),
        teamIdentifier: ENV.fetch("TEAM_IDENTIFIER"),
        logoText: event.name,
        backgroundColor: "rgb(60, 65, 75)",
        foregroundColor: "rgb(255, 255, 255)",
        expirationDate: (event.date + 5.days).iso8601,

        eventTicket: {
          primaryFields: [
            {
              key: "name",
              label: "Participant",
              value: participant.name
            },
            {
              key: "eventName",
              label: "Event",
              value: event.name
            },
            {
              key: "eventDate",
              label: "Date",
              value: event.date.strftime("%B %d, %Y")
            }
          ]
        },

        barcode: {
          message: token,
          format: "PKBarcodeFormatQR",
          messageEncoding: "iso-8859-1"
        },

        userInfo: {
          jwt: token
        }
      }

      # If NFC message is not provided, default to JWT token as NFC message
      nfc_message ||= token

      # Add NFC if message provided
      if nfc_message
        pass[:nfc] = {
          message: Base64.strict_encode64(nfc_message)
        }
        if nfc_encryption_public_key
          pass[:nfc][:encryptionPublicKey] = Base64.strict_encode64(nfc_encryption_public_key)
        end
      end

      pass
    end
  end
end


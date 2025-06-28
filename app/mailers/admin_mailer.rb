class AdminMailer < ApplicationMailer
    
    def send_code(email, code)
        @code = code
        mail(to: email, subject: 'Your Email Confirmation Code for Aha!')
    end

    def invitation(event, admin)
        @event = event.name
        @manager = event.manager.name
        mail(to: admin.email, subject: "Invitation to Administer Event: #{@event}")
    end

    def send_change_email(email, link)
        @link = link
        mail(to: email, subject: 'Change Your Email for Aha!')
    end
end

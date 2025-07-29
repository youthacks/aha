
# PassGenerator: generates and signs Apple Wallet passes (.pkpass)
require 'zip'
require 'openssl'
require 'digest/sha1'
require 'json'
require 'fileutils'

module AppleWallet
  class PassGenerator
    CERT_PATH = Rails.root.join("config/passkit/certificates/passcertificate.pem")
    KEY_PATH = Rails.root.join("config/passkit/certificates/passkey.pem")
    WWDR_PATH = Rails.root.join("config/passkit/certificates/wwdr.pem")

    ASSET_PATH = Rails.root.join("app/assets/passkit")

    def initialize(pass_data)
      @pass_data = pass_data
    end

    def generate
      Dir.mktmpdir do |dir|
        # 1. Write pass.json
        File.write("#{dir}/pass.json", JSON.pretty_generate(@pass_data))
        

        # 2. Copy required assets
        %w[icon.png logo.png].each do |asset|
          asset_path = ASSET_PATH.join(asset)
          FileUtils.cp(asset_path, "#{dir}/#{asset}") if File.exist?(asset_path)
        end

        # 3. Create manifest
        manifest = {}
        Dir["#{dir}/*"].each do |file|
          filename = File.basename(file)
          manifest[filename] = Digest::SHA1.file(file).hexdigest
        end
        File.write("#{dir}/manifest.json", JSON.generate(manifest))

        # 4. Sign the manifest
        pkcs7 = sign_manifest("#{dir}/manifest.json")
        File.binwrite("#{dir}/signature", pkcs7.to_der)

        # 5. Zip into .pkpass
        pass_path = Rails.root.join("tmp", "#{@pass_data[:serialNumber]}.pkpass")
        FileUtils.mkdir_p(pass_path.dirname)

        Zip::File.open(pass_path.to_s, Zip::File::CREATE) do |zip|
          Dir["#{dir}/*"].uniq.each do |file|
            filename = File.basename(file)
            zip.add(filename, file) unless zip.find_entry(filename)
          end
        end

        pass_path
      end
    end

    private

    def sign_manifest(manifest_path)
      cert = OpenSSL::X509::Certificate.new(File.read(CERT_PATH))
      key = OpenSSL::PKey::RSA.new(File.read(KEY_PATH))
      wwdr = OpenSSL::X509::Certificate.new(File.read(WWDR_PATH))

      signed = OpenSSL::PKCS7.sign(cert, key, File.read(manifest_path), [wwdr], OpenSSL::PKCS7::BINARY | OpenSSL::PKCS7::DETACHED)
      signed
    end
  end
end
  
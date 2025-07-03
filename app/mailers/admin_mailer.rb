class AdminMailer < ApplicationMailer
    
    def send_code(email, code)
        @code = code
        mail(to: email, subject: "[Aha] #{@code} - Signup code for Aha!")
    end

    def invitation(event, admin)
        @event = event.name
        @manager = event.manager.name
        mail(to: admin.email, subject: "[Aha] #{@event} - Invitation to Administer Event")
    end

    def send_change_email(email, link)
        @link = link
        mail(to: email, subject: "[Aha] - Change Your Email")
    end
end

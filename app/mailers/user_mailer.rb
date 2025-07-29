# app/mailers/user_mailer.rb
class UserMailer < ApplicationMailer
  default from: 'm'  # Custom sender

  def welcome_email()
    mail(to: "v+neya63b75avs@myunidays.com", subject: 'Welcome to Our App')
  end
end

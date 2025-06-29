// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"
import { Application } from "@hotwired/stimulus"
import Sortable from "sortablejs"
import "@rails/ujs"

const application = Application.start()
Rails.start()

// Configure Stimulus development experience
application.debug = false
window.Stimulus   = application


export { application }

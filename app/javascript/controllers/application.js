import { Application } from "@hotwired/stimulus"
import Sortable from "sortablejs"
import "@rails/ujs"

const application = Application.start()
Rails.start()

// Configure Stimulus development experience
application.debug = false
window.Stimulus   = application

document.addEventListener('DOMContentLoaded', function() {
  const lists = document.getElementsByClassName('sortable-list');
  Array.from(lists).forEach(function(item) {
    Sortable.create(item, { animation: 150 });
  });
});


export { application }

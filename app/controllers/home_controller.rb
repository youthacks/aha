class HomeController < ApplicationController
#   before_action :require_admin
	before_action :require_event, only: [:products, :products_refresh]
	def index
		@admin = Admin.find_by(id: session[:admin_id]) # Check if an admin is logged in
        redirect_to dashboard_path if @admin
	end
	def products
		@products = @event.products.active
		if session[:admin_id].present? && Admin.exists?(session[:admin_id])
			@admin = Admin.find(session[:admin_id])
		end
    end
	def products_refresh
        @products = @event.products.active
        render partial: "home/products", locals: { products: @products }
    end

    def event_dashboard
        if session[:admin_id].present? && Admin.exists?(session[:admin_id]) && params[:event_slug].present? && Event.exists?(slug: params[:event_slug]) && (Event.find_by(slug: params[:event_slug]).admins.include?(session[:admin_id]) || Event.find_by(slug: params[:event_slug]).manager_id == session[:admin_id])
            redirect_to event_dashboard_path(params[:event_slug])
        else
            redirect_to event_products_path(event_slug: params[:event_slug]) if params[:event_slug].present?
        end
    end

  	private
  	def require_event
        begin 
            event = Event.friendly.find(params[:event_slug])
            unless event.present?
                redirect_to dashboard_path, alert: "Event not found."
                return
            else
                @event = event
            end
        rescue => e
            redirect_to dashboard_path, alert: "Event does not exist."
        end
    end
#   def require_admin
#     if session[:admin_id].present? && Admin.exists?(session[:admin_id])
#       @admin = Admin.find(session[:admin_id])
#     end
#   end
end
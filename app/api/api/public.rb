module Api
    class Public < Grape::API
        desc 'Get public event details' do
            summary 'Get public event details'
            detail 'Returns public details of the event'
            tags ['Public']
            success Api::Entities::Event::Public
            failure [[404, 'Event not found', Api::Entities::Error]]
        end
        params do
            requires :event_slug, type: String, desc: 'The event slug'
        end
        get 'events/:event_slug' do
            @event = Event.find_by(slug: params[:event_slug])
            error!({ message: 'Event not found' }, 404) unless @event
            present @event, with: Api::Entities::Event::Public
        end

        desc 'Get products for an event' do
            summary 'Get products for an event'
            detail 'Returns a list of active products for the event'
            tags ['Public']
            success Api::Entities::Product
            failure [[404, 'Event not found', Api::Entities::Error]]
        end
        params do
            requires :event_slug, type: String, desc: 'The event slug'
        end
        get 'events/:event_slug/products' do
            @event = Event.find_by(slug: params[:event_slug])
            error!({ message: 'Event not found' }, 404) unless @event
            present @event.products.active, with: Api::Entities::Product
        end
    end
end
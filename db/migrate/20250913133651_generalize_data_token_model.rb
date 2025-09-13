class GeneralizeDataTokenModel < ActiveRecord::Migration[8.0]
  def change
    remove_column :data_tokens, :type, :name, :email, :password, :code
    add_column :data_tokens, :data, :array
  end
end


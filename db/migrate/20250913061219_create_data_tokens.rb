class CreateDataTokens < ActiveRecord::Migration[8.0]
  def change
    create_table :data_tokens do |t|
      t.string :type
      t.string :name
      t.string :email
      t.string :password
      t.string :code

      t.timestamps
    end
  end
end

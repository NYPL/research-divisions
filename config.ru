#require 'rack/contrib/try_static'
#
#use Rack::TryStatic, 
#    :root => "public",  # static files root dir
#    :urls => %w[/],     # match all requests 
#    :try => ['.html', 'index.html', '/index.html'] # try these postfixes sequentially
#run lambda {|env| [404, {'Content-Type' => 'text/html'}, ['Not Found']]}

require './researchinator.rb'
run Researchinator


require 'date'
require 'sinatra/base'
require 'sinatra/jsonp'
require 'lionactor'
require 'erb'

class Researchinator < Sinatra::Base
  configure do
    set :researchinator_env, ENV['RESEARCHINATOR_ENV']
    if settings.researchinator_env === 'development'
      set :refinery_api, 'dev-'
    elsif settings.researchinator_env === 'qa'
      set :refinery_api, 'qa-'
    else
      set :refinery_api, ''
    end

    configs = JSON.parse(File.read('researchinator.json'))
    if configs["environments"].has_key?(ENV['RESEARCHINATOR_ENV'])
      set :env_config, configs["environments"][ENV['RESEARCHINATOR_ENV']]
    else
      set :env_config, 
        configs["environments"][configs["environments"]["default"]]
    end
    set :divisions_with_appointments, configs["divisions_with_appointments"]
    set :featured_amenities, configs["featured_amenities"]
    set :research_order, configs["research_order"]
    set :fundraising, configs["fundraising"]
    set :baseurl, '/research-collections/'

    set :app_cfg, JSON.generate({
      "config" => {
        "self" => settings.env_config["url"],
        "tz_offset" => DateTime.now().strftime("%z"),
        "api_root" => settings.env_config["api"],
        "api_version" => settings.env_config["api_version"],
        "divisions_with_appointments" => settings.divisions_with_appointments,
        "featured_amenities" => settings.featured_amenities,
        "research_order" => settings.research_order,
        "fundraising" => settings.fundraising,
        "closed_img" => settings.env_config["closed_img"],
        "research_shortnames" => settings.env_config["research_shortnames"]
      }
    })

  end

  before do
    headers 'Access-Control-Allow-Origin' => '*',
    'Access-Control-Allow-Methods' => ['GET'],
    'Access-Control-Allow-Headers' => 'Content-Type'
  end

  helpers Sinatra::Jsonp
  set :protection, :except => :frame_options

  # Method cribbed from http://blog.alexmaccaw.com/seo-in-js-web-apps
  helpers do
    set :spider do |enabled|
      condition do
        params.has_key?('_escaped_fragment_')
      end
    end
  end

  get '/', :spider => true do
    api = Lionactor::Client.new
    @divisions = api.divisions
    erb :seo_rc
  end


  get %r{/} do
    @rq = request
    erb :research_collections
  end 

  # start the server if ruby file executed directly
  run! if app_file == $0

end

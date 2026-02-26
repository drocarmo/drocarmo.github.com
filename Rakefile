# Standard library
require 'rake'
require 'yaml'
require 'kramdown'
require 'sassc'

# Load the configuration file
config = YAML.load_file("_config.yml")

# Default Rake
desc "compile and run the site"
task :default do
  pids = [
    spawn("JEKYLL_ENV=production bundle exec jekyll serve --trace"), # put `auto: true` in your _config.yml
    spawn("sass --watch css/main.scss:css/main.css"),
  ]

  trap "INT" do
    Process.kill "INT", *pids
    exit 1
  end

  loop do
    sleep 1
  end
end

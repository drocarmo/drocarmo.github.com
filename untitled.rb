gem "jekyll", ">= 4.3.0"
gem "kramdown", ">=2.3.0"
gem "rake", ">= 13.0.6"
gem "sassc"
gem "scss_lint", require: false
gem "webrick"

group :jekyll_plugins do
  gem "jekyll-sitemap"
  gem "jekyll-feed"
  gem "jekyll-seo-tag"
end

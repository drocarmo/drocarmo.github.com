# -*- encoding: utf-8 -*-
# stub: scss_lint 0.57.1 ruby lib

Gem::Specification.new do |s|
  s.name = "scss_lint".freeze
  s.version = "0.57.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Brigade Engineering".freeze, "Shane da Silva".freeze]
  s.date = "2018-09-27"
  s.description = "Configurable tool for writing clean and consistent SCSS".freeze
  s.email = ["eng@brigade.com".freeze, "shane@dasilva.io".freeze]
  s.executables = ["scss-lint".freeze]
  s.files = ["bin/scss-lint".freeze]
  s.homepage = "https://github.com/brigade/scss-lint".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.1".freeze)
  s.rubygems_version = "3.0.9".freeze
  s.summary = "SCSS lint tool".freeze

  s.installed_by_version = "3.0.9" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<rake>.freeze, [">= 0.9", "< 13"])
      s.add_runtime_dependency(%q<sass>.freeze, ["~> 3.5", ">= 3.5.5"])
    else
      s.add_dependency(%q<rake>.freeze, [">= 0.9", "< 13"])
      s.add_dependency(%q<sass>.freeze, ["~> 3.5", ">= 3.5.5"])
    end
  else
    s.add_dependency(%q<rake>.freeze, [">= 0.9", "< 13"])
    s.add_dependency(%q<sass>.freeze, ["~> 3.5", ">= 3.5.5"])
  end
end

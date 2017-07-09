require 'open-uri'
require 'yaml'

desc 'Build site into docs directory'
task :build do
  jekyll_build
end

desc 'Update index.md and spec folder based on versions in _config.yml'
task :update do
  config = YAML.load_file('_config.yml')
  current_version = config['current_version']
  versions = config['versions']

  remove_all_specs(config['update'])

  puts ''
  puts 'Fetching configured spec versions:'
  versions.each do |version|
    spec = fetch_spec(version, config['update'])

    if current_version == version
      write_file('index.md', spec[:body], " (#{version})")
    end

    filename = File.join(config['update']['output_dir'], version)
    write_file("#{filename}.md", spec[:body])
    write_file("#{filename}.svg", spec[:diagram]) if spec[:diagram]
  end

  jekyll_build
end

def jekyll_build
  puts 'Rebuilding output into docs directory...'
  exec 'jekyll build --destination docs && touch docs/.nojekyll'
end

def write_file(file, content, comment = nil)
  puts " - #{file}#{comment}"
  File.write(file, content)
end

def fetch_spec(version, config)
  document = get(build_file_url('document', version, config))
  diagram = get(build_file_url('diagram', version, config))

  if diagram
    img_tag = config['img_tpl'].gsub('{{file}}', "#{version}.svg")
    document.gsub!(/\A(.*\n=+\n)/, "\\1\n#{img_tag}\n")
  end

  title = document.split("\n", 2).first
  body = config['body_tpl'].gsub('{{content}}', document)
                           .gsub('{{title}}', title)
                           .gsub('{{version}}', version)

  {
    version: version,
    title: title,
    body: body,
    diagram: diagram
  }
end

def build_file_url(file, version, config)
  config['url_tpl']
    .gsub('{{version}}', version)
    .gsub('{{file}}', config['files'][file])
end

def get(url)
  URI.parse(url).read
rescue OpenURI::HTTPError
  nil
end

def remove_all_specs(config)
  puts ''
  puts 'Removing existing spec files:'
  Dir["#{config['output_dir']}/*"].each do |file|
    puts "   #{file.gsub(File.dirname(__FILE__), '')}"
    File.delete(file)
  end
end

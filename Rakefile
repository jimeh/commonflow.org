require 'open-uri'
require 'yaml'

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

    spec_file = File.join(config['update']['output_dir'], "#{version}.md")
    write_file(spec_file, spec[:body])
  end
end

def write_file(file, content, comment = nil)
  puts " - #{file}#{comment}"
  File.write(file, content)
end

def fetch_spec(version, config)
  doc_url = config['url_tpl']
            .gsub('{{version}}', version)
            .gsub('{{file}}', config['files']['document'])
  diagram_url = config['url_tpl']
                .gsub('{{version}}', version)
                .gsub('{{file}}', config['files']['diagram'])

  document = get(doc_url)
  diagram = get(diagram_url)

  if diagram
    img_tag = config['img_tpl'].gsub('{{file}}', "#{version}.svg")
    document.gsub!(/\A(.*\n=+\n)/, "\\1\n#{img_tag}\n")
  end

  title = document.split("\n", 2).first
  body = config['body_tpl']
         .gsub('{{title}}', title)
         .gsub('{{version}}', version)
         .gsub('{{content}}', document)

  {
    version: version,
    title: title,
    body: body,
    diagram: diagram
  }
end

def fetch_document(url)
  response = get(url)
  {

    body: response
  }
end

def fetch_diagram(url)
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

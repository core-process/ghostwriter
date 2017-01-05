import URI from 'urijs';

export default function adjustUrlBase(url, baseUrl) {
  baseUrl = URI(baseUrl);
  return URI(url)
    .protocol(baseUrl.protocol())
    .username(baseUrl.username())
    .password(baseUrl.password())
    .hostname(baseUrl.hostname())
    .port(baseUrl.port())
    .toString();
}

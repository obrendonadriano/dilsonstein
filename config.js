window.APP_CONFIG = {
  whatsapp: {
    number: "5511925517859",
    message: "Olá, meu nome é {name}, tenho {age} anos e me cadastrei para participar da seleção em {city}, {location_sentence}, às {time}. Gostaria de mais informações sobre como participar."
  },
  supabase: {
    url: "https://grohztewndqwfyvdgjar.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb2h6dGV3bmRxd2Z5dmRnamFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTkyODQsImV4cCI6MjA4OTczNTI4NH0.EsY9wxVaocBOAx541rF200nNWJBT30aiP7Rk2iJX0LM",
    table: "leads"
  },
  crm: {
    endpoint: "",
    apiKey: ""
  },
  facebook: {
    pixelId: "928735966754524",
    conversionProxyUrl: "/api/facebook-conversion",
    testEventCode: "TEST37800"
  },
  scheduling: {
    defaultCities: [
      {
        label: "Campinas 10/04",
        venue_name: "Hotel Leon Park",
        address: "Av. Francisco Glicério, 641"
      },
      {
        label: "São Paulo 12/04",
        venue_name: "Local a confirmar",
        address: "Endereço a confirmar"
      },
      {
        label: "Sorocaba 14/04",
        venue_name: "Local a confirmar",
        address: "Endereço a confirmar"
      }
    ],
    defaultTimes: [
      "10h",
      "12h",
      "15h30",
      "17h30",
      "19h30"
    ]
  }
};

const data = fetch('./output.json')

getData()

async function getData() {
  var symbols = data.symbols
  symbols.forEach(element => {
    console.log(element.volatility['5day'])
  });
}

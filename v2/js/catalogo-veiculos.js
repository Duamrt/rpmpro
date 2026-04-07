// RPM Pro — Catálogo de Marcas e Modelos (mercado brasileiro)
const CATALOGO_VEICULOS = {
  'Chevrolet': ['Onix','Onix Plus','Tracker','S10','Spin','Cobalt','Cruze','Montana','Equinox','Trailblazer','Prisma','Celta','Corsa','Classic','Agile','Vectra','Astra','Meriva','Zafira','Captiva','Blazer','Silverado'],
  'Fiat': ['Argo','Mobi','Strada','Toro','Cronos','Pulse','Fastback','Uno','Palio','Siena','Grand Siena','Punto','Linea','Bravo','Idea','Weekend','Doblo','Fiorino','Ducato','Marea','Stilo','Tipo','500'],
  'Volkswagen': ['Gol','Polo','T-Cross','Virtus','Saveiro','Amarok','Nivus','Taos','Tiguan','Jetta','Golf','Fox','Voyage','Up','Fusca','Kombi','SpaceFox','CrossFox','Passat'],
  'Ford': ['Ka','Ka Sedan','EcoSport','Ranger','Territory','Maverick','Bronco Sport','Fiesta','Focus','Fusion','Edge','F-250','F-1000','Courier'],
  'Hyundai': ['HB20','HB20S','Creta','Tucson','ix35','Santa Fe','Azera','Elantra','Veloster','i30','HB20X'],
  'Toyota': ['Hilux','Corolla','Corolla Cross','Yaris','Yaris Sedan','SW4','RAV4','Etios','Camry','Prius','Land Cruiser'],
  'Honda': ['Civic','City','HR-V','WR-V','ZR-V','CR-V','Fit','Accord','City Hatchback'],
  'Renault': ['Kwid','Sandero','Logan','Duster','Oroch','Captur','Stepway','Fluence','Megane','Clio','Scenic','Master'],
  'Jeep': ['Renegade','Compass','Commander','Gladiator','Wrangler','Cherokee','Grand Cherokee'],
  'Nissan': ['Kicks','Versa','Frontier','Sentra','March','Livina','Tiida','X-Trail'],
  'Mitsubishi': ['L200 Triton','Outlander','Outlander Sport','Eclipse Cross','Pajero','Pajero Sport','ASX','Lancer'],
  'Peugeot': ['208','2008','3008','5008','Partner','Expert','Boxer','206','207','307','308','408','508'],
  'Citroën': ['C3','C4 Cactus','Jumpy','Jumper','C3 Aircross','C4 Lounge','C5','Berlingo','Xsara Picasso','C3 Picasso'],
  'Kia': ['Sportage','Cerato','Seltos','Sorento','Carnival','Stonic','Soul','Picanto','Optima'],
  'BMW': ['Série 1','Série 2','Série 3','Série 5','X1','X3','X5','X6','Z4','M3','M5','320i','328i','520i'],
  'Mercedes-Benz': ['Classe A','Classe C','Classe E','GLA','GLB','GLC','GLE','Sprinter','Vito','Actros','Atego','C180','C200','C250'],
  'Audi': ['A3','A4','A5','A6','Q3','Q5','Q7','Q8','TT','RS3','RS5','e-tron'],
  'Volvo': ['XC40','XC60','XC90','S60','S90','V60','V90'],
  'Suzuki': ['Jimny','Vitara','S-Cross','Swift','Grand Vitara'],
  'Subaru': ['Forester','Impreza','XV','WRX','Outback','Legacy'],
  'RAM': ['Rampage','1500','2500','3500'],
  'Caoa Chery': ['Tiggo 3X','Tiggo 5X','Tiggo 7','Tiggo 8','Arrizo 5','Arrizo 6'],
  'BYD': ['Dolphin','Dolphin Mini','Song Plus','Song Pro','Seal','Han','Tang','Yuan Plus'],
  'GWM': ['Haval H6','Haval Jolion','Ora 03','Poer'],
  'Land Rover': ['Defender','Discovery','Discovery Sport','Range Rover','Range Rover Sport','Range Rover Evoque','Range Rover Velar'],
  'Porsche': ['Cayenne','Macan','Panamera','911','Boxster','Cayman','Taycan'],
  'Yamaha': ['Fazer 150','Fazer 250','MT-03','MT-07','MT-09','XTZ 150','XTZ 250','YBR 125','Factor 125','Factor 150','Neo 125','NMAX 160','Crosser 150'],
  'Honda Motos': ['CG 125','CG 150','CG 160','CB 250 Twister','CB 300','CB 500','CBR 650','Biz 110','Biz 125','Pop 110','Bros 160','XRE 190','XRE 300','PCX 160','Elite 125','ADV 150','Sahara 300'],
  'Motocicletas Diversas': ['Shineray','Dafra','Haojue','Kawasaki Ninja','Kawasaki Z','Triumph','BMW GS','Ducati','Harley-Davidson']
};

// Helper: retorna array de marcas ordenado
function getMarcas() {
  return Object.keys(CATALOGO_VEICULOS).sort();
}

// Helper: retorna modelos de uma marca
function getModelos(marca) {
  return CATALOGO_VEICULOS[marca] || [];
}

// Helper: gera options de marcas pra select
function optionsMarcas(selected) {
  const marcas = getMarcas();
  const isCustom = selected && !marcas.includes(selected);
  return '<option value="">Selecione a marca</option>' +
    marcas.map(m => `<option value="${m}" ${m === selected ? 'selected' : ''}>${m}</option>`).join('') +
    `<option value="__outro" ${isCustom ? 'selected' : ''}>Outro (digitar)</option>`;
}

// Helper: gera options de modelos pra select
function optionsModelos(marca, selected) {
  const modelos = getModelos(marca);
  if (!modelos.length) return '<option value="">Selecione a marca primeiro</option>';
  return '<option value="">Selecione o modelo</option>' +
    modelos.map(m => `<option value="${m}" ${m === selected ? 'selected' : ''}>${m}</option>`).join('') +
    '<option value="__outro">Outro (digitar)</option>';
}

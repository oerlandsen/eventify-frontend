// Barrios (neighborhoods) data for Santiago
// Each barrio has coordinates that form a polygon shape
// Colors use Eventify-style purple theme
//
// Data Structure:
// - id: unique identifier
// - name: display name of the barrio
// - coordinates: array of {latitude, longitude} objects forming the polygon
// - fillColor: polygon fill color (rgba format)
// - strokeColor: polygon border color (rgba format)
// - photos: array of image URLs (can be local assets like require('./path/to/image.jpg') or remote URLs)
// - schedule: optional object with { open: string, close: string } (e.g., { open: "09:00", close: "18:00" })
// - keywords: optional array of strings describing the neighborhood (e.g., ["Artesanía", "Comida", "Vida Nocturna"])
// - shortDescription: 1-3 line description of the neighborhood
// - recommendations: array of recommendation objects with:
//   - category: string (e.g., "Casas de arte", "Bares", "Cafés", "Restaurantes", "Edificios patrimoniales")
//   - items: array of strings (names of places/items in that category)
//
// To add more photos: Add URLs or require() statements to the photos array
// To add more recommendations: Add objects to the recommendations array with category and items

const barrios = [
  {
    id: 'Yungay',
    name: 'Barrio Yungay',
    coordinates: [
      { latitude: -33.435814078195925, longitude: -70.68025210496316 },
      { latitude: -33.43490673660536, longitude: -70.66897548581743 },
      { latitude: -33.447712336969104, longitude: -70.66754649275764 },
      { latitude: -33.45053760962493, longitude: -70.6788852420364 },
    ],
    fillColor: 'rgba(159, 123, 255, 0.2)', // Purple transparent fill
    strokeColor: 'rgba(159, 123, 255, 0.6)', // Darker purple border
    photos: [
      "https://offloadmedia.feverup.com/santiagosecreto.com/wp-content/uploads/2022/10/18063838/Barrio-Yungay.jpg",
      "https://cdn0.matrimonios.cl/vendor/2847/3_2/960/jpg/fachada-sitio_8_182847-170043422066102.jpeg",
      "https://www.santiagoturismo.cl/wp-content/uploads/2021/03/DSC_8123-1-scaled.jpg",
      "https://www.df.cl/noticias/site/artic/20240809/imag/foto_0000005520240809140119/C1024D7B-5630-4E46-A439-8174F7B91CC0.jpeg",
      "https://media.admagazine.com/photos/657e54890604e094a40e5236/master/pass/Barrio-yungay.jpg",
      "https://revistaenfoque.cl/wp-content/uploads/2017/11/Barrio_Yungay_w1200_1200_675-960x675.jpg",
      "https://www.latercera.com/resizer/v2/XJQZHIYNHVDIFB6EJG5YBP4D7U.jpg?auth=c92e7ce9d81b8f220e86fb867c039022fce2b2c12388edddec26456bde381b6d&smart=true&width=800&height=420&quality=70",
    ],
    schedule: {
      open: "09:00",
      close: "23:00",
    },
    keywords: ["Patrimonio", "Cultura", "Arte", "Comida"],
    shortDescription: '"Uno de los barrios más antiguos de Santiago, con un fuerte valor patrimonial y residencial. Sus calles tranquilas, plazas y arquitectura del siglo XIX conviven con centros culturales, museos pequeños y murales que narran su historia reciente. Es un barrio apropiado para quienes valoran el ritmo pausado, el patrimonio y la vida de barrio, con una presencia activa de comunidad local y actividades vinculadas a la memoria y la cultura."',
    recommendations: [
      {
        category: 'Cultura',
        items: ['Museo de la Memoria y DD.HH','Centro Cultural Matucana 100', 'Teatro Novedades','Museo del Sonido','Museo Taller','Museo de la Educación Gabriel Mistral','Espacio Gargola','Casa Foto'],
      },
      {
        category: 'Patrimonio',
        items: ['Palacio Álamos', 'Peluquería Francesa'],
      },
      {
        category: 'Comida',
        items: ['Na Que Ver (Nacional)','Fuente Mardoqueo (Nacional)','El Huaso Enrique (Nacional)', 'Café Cité','San Camilo'],
      },
    ],
  },
  {
    id: 'Lastarria',
    name: 'Barrio Lastarria',
    coordinates: [
      { latitude: -33.43758312086804, longitude: -70.63658042117862},
      { latitude: -33.43687582547815, longitude: -70.63680572673337 },
      { latitude: -33.43680420030706, longitude: -70.63983125846855 },
      { latitude: -33.43599841305845, longitude: -70.6432001129538 },
      { latitude: -33.4378952802519, longitude: -70.64347396504286 },
      { latitude: -33.440798161770736, longitude: -70.64477038034886},
      { latitude: -33.442168432335805, longitude: -70.64411136923857},
    ],
    fillColor: 'rgba(159, 123, 255, 0.2)',
    strokeColor: 'rgba(159, 123, 255, 0.6)',
    photos: [
      'https://disfrutasantiago.cl/wp-content/uploads/2022/11/BARRIO-LASTARRIA-5-scaled.jpg',
      "https://upload.wikimedia.org/wikipedia/commons/e/ed/Barrio_Lastarria_Santiago.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Bar_El_Bi%C3%B3grafo%2C_Santiago_20230421.jpg/2560px-Bar_El_Bi%C3%B3grafo%2C_Santiago_20230421.jpg",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2e/a4/57/f5/lastarria-neighbourhood.jpg?w=900&h=500&s=1",
      "https://resermap.s3.amazonaws.com/restaurant/chipe-libre-5ddf2d5fcc455_original.jpeg",
      "https://gam.cl/media/images/0000001300_Fachada_GAM_alta.max-1200x900.jpg",
      "https://media-front.elmostrador.cl/2016/05/museo.jpg",
    ],
    schedule: {
      open: "10:00",
      close: "23:00",
    },
    keywords: ["Cultura", "Gastronomía", "Museos","Ferias"],
    shortDescription: '“Barrio céntrico de carácter patrimonial y cultural, conocido por sus calles peatonales, oferta de librerías, espacios de arte y diseño. Es un sector ideal para recorrer a pie, visitar museos como el MAVI o el de Bellas Artes, asistir a funciones teatrales o descansar en alguna plaza. Se orienta a quienes disfrutan de panoramas culturales y urbanos en entornos con historia. Se puede esperar una mezcla de visitantes locales y turistas, y una oferta variada de locales tranquilos, cafeterías, tiendas independientes y ferias ocasionales.”',
    recommendations: [
      {
        category: 'Cultura',
        items: ['Centro Cultural GAM','Museo de Artes Visuales', 'Museo Bellas Artes','Museo de Arte Contemporáneo','Cine El Biógrafo','La Tienda Nacional'],
      },
      {
        category: 'Comida',
        items: ['Chipe Libre', 'Doméstico Café','Wonderland Café','Bar Flama', 'Le Fournil','Holy Moly','Castillo Forestal'],
      },
      
      
    ],
  },
  {
    id: 'Plza. Nunoa',
    name: 'Plaza Ñuñoa',
    coordinates: [
      { latitude: -33.45681381649201, longitude:  -70.59332906190615 },
      { latitude: -33.4537703942005, longitude: -70.5932110447108 },
      { latitude: -33.45375249140043, longitude: -70.59406935158603 },
      { latitude: -33.45676906105573, longitude: -70.59420882645325 },
    ],
    fillColor: 'rgba(159, 123, 255, 0.2)',
    strokeColor: 'rgba(159, 123, 255, 0.6)',
    photos: ["https://cctn.cl/wp-content/uploads/2023/11/IMG-20231105-WA0030-e1699364921536.jpg",
"https://cctn.cl/wp-content/uploads/2023/03/IMG-20230322-WA0033.jpg",
"https://comunanunoa.cl/wp-content/uploads/2024/07/11.jpg",
      "https://www.futuro.cl/wp-content/uploads/2025/01/nunoa-4-768x432.webp",
      "https://comunanunoa.cl/wp-content/uploads/2024/07/05.webp",
    ],
    schedule: {
      open: "08:00",
      close: "21:00",
    },
    keywords: ["Cultura", "Espacios Verdes", "Comunidad"],
    shortDescription: '“El corazón de Ñuñoa, con fuerte vida de barrio y presencia de teatros, restaurantes, librerías y espacios culturales. La plaza y sus alrededores se activan especialmente en las tardes y fines de semana, atrayendo tanto a familias como a grupos de jóvenes y personas que buscan lugares al aire libre para conversar o asistir a funciones. La oferta gastronómica es amplia, así como también las actividades relacionadas al arte y la cultura.”',
    recommendations: [ {
      category: 'Cultura',
      items: ['Teatro UC','La Batuta'],
    },
    {
      category: 'Patrimonio',
      items: ['Municipalidad de Ñuñoa'],
    },
    {
      category: 'Comida',
      items: ['Los Lanzas (Nacional)','Boulevard Plaza Ñuñoa', 'Fuente Suiza'],
    },],
  },
  {
    id: 'barrio-italia',
    name: 'Barrio Italia',
    coordinates: [
      { latitude: -33.44273188178792, longitude: -70.63091691132955 },
      { latitude: -33.45232537371115, longitude: -70.62873099889346 },
      { latitude: -33.453532371395745, longitude: -70.62233954775238 },
      { latitude: -33.45292285540593, longitude: -70.61600170457301 },
      { latitude: -33.43983625878352, longitude:-70.6183158755004 },
    ],
    fillColor: 'rgba(159, 123, 255, 0.2)',
    strokeColor: 'rgba(159, 123, 255, 0.6)',
    photos: [
      "https://cctn.cl/wp-content/uploads/2023/03/12-1-scaled-e1679007934833.jpg",
      "https://providencia.cl/provi/site/artic/20241002/imag/foto_0000000120241002101849/jazz_noche.jpg",
      "https://offloadmedia.feverup.com/santiagosecreto.com/wp-content/uploads/2023/07/08103304/2-11.png",
      "https://redsalasdeteatro.cl/wp-content/uploads/2024/08/DSC00384-scaled.jpg",
      "https://media.viajando.travel/p/a55165f5ab7a0d4e07c814688541518a/adjuntos/236/imagenes/000/707/0000707700/1200x675/smart/comedy-restobar.jpg",
    ],
    schedule: {
      open: "10:00",
      close: "23:00",
    },
    keywords: ["Cultura", "Vida Nocturna", "Gastronomía", "Tiendas"],
    shortDescription: 'Ubicado entre Ñuñoa y Providencia, combina antiguas casonas con locales de diseño, talleres de oficios, tiendas de ropa, librerías y una gran variedad de espacios gastronómicos. Es un lugar frecuentado por quienes buscan pasear con calma, comprar productos independientes o reunirse en patios compartidos. El ambiente es diverso y tranquilo, con una fuerte presencia de espacios creativos y comercio local. Además, Barrio Italia destaca por su vida nocturna en crecimiento, con bares, coctelerías y espacios de artes escénicas que llenan sus calles de música, teatro íntimo y propuestas culturales alternativas, convirtiéndolo en uno de los polos bohemios más interesantes de Santiago.',
    recommendations: [
      {
        category: 'Cultura',
        items: ['Comedy Restobar', 'El Cachafaz', 'Palermo Teatro Bar','Bar de René'],
      },
      {
        category: 'Comida',
        items: ['El Hoyo (Nacional)','Chiloé en tu Mesa (Nacional)','Alleria Pizzeria', 'Café de la Candelaria', 'Tío Tomate', 'Verde Sazón','Galpón Italia'],
      },
      {
        category: 'Patrimonio',
        items: ['Factoria Italia'],
      },
      {
        category: 'Tiendas',
        items: ['Galería La Bota Italia', 'Arte Cultivos','Bodega Italia'],
      },
    ],
  },
  {
    id: 'Los Dominicos',
    name: 'Barrio Pueblito de los Dominicos',
    coordinates: [
      { latitude: -33.40895172147666, longitude: -70.54186989391415},
      { latitude: -33.40851287524909, longitude: -70.54006744947617 },
      { latitude: -33.40571853706399, longitude: -70.54119397724992 },
      { latitude: -33.40600513998891, longitude: -70.54284621798472 },
    ],
    fillColor: 'rgba(159, 123, 255, 0.2)',
    strokeColor: 'rgba(159, 123, 255, 0.6)',
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/9/9f/Iglesia_de_Los_Dominicos%2C_Las_Condes%2C_Santiago_20230929_01.jpg",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/2f/9c/46/la-calle-larga.jpg?w=1200&h=-1&s=1",
      "https://santiagoando.com/wp-content/uploads/sites/13/2022/05/TIENDA-ARTESANIAS-DE-CHILE-Los-Dominicos-lana-AHM-M.jpg",
      "https://www.lascondes.cl/wp-content/uploads/2023/10/dominicos.jpg",
      "https://site.visitsantiago.org/wp-content/uploads/2020/07/016-Pueblito-los-Dominicos-scaled.jpg",
      "https://cloudfront-us-east-1.images.arcpublishing.com/copesa/OOJBMAADDZHX5E5OZBSLOS3NUE.jpg",
    ],
    schedule: {
      open: "10:30",
      close: "20:00",
    },
    keywords: ["Artesanía", "Patrimonio", "Gastronomía"],
    shortDescription: '"El Pueblito de los Dominicos es un encantador mercado artesanal que combina el sabor tradicional chileno con un entorno urbano de libre acceso. Explora una amplia variedad de productos: artesanía en plata, cobre, madera, lapislázuli, cuero, telas y más, creados por artistas y artesanos de todas las regiones de Chile. Desde sus orígenes en los años 70–80, cuando artesanos empezaron a instalarse junto a la iglesia San Vicente Ferrer (o de los Dominicos) y los antiguos graneros del fundo Apoquindo, el recinto ha crecido y se ha convertido en una "zona típica" de Santiago: calles de tierra, casas de adobe y paja, y una atmósfera que invita a pasear con calma."',
    recommendations: [{
      category: 'Cultura',
      items: ['Museo de Cera'],
    },
    {
      category: 'Patrimonio',
      items: ['Iglesia San Vicente de Ferrer'],
    },],
  },
  {
    id: 'El Golf',
    name: 'Barrio El Golf',
    coordinates: [
      { latitude: -33.4142878099928, longitude: -70.58484737546335 },
      { latitude: -33.41800168019287, longitude: -70.60138386418967},
      { latitude: -33.41689912999962, longitude: -70.60480104818959 },
      { latitude: -33.41154370937663, longitude: -70.60281052074758 },
      { latitude: -33.41262668807855, longitude: -70.5975498410487 },
      { latitude: -33.41265635853866, longitude:-70.59502613661333 },
      { latitude: -33.410564566273266, longitude:-70.58690407367624 },
    ],
    fillColor: 'rgba(159, 123, 255, 0.2)',
    strokeColor: 'rgba(159, 123, 255, 0.6)',
    photos: ["https://santiagochile.com/wp-content/uploads/El-Golf-f.png",
      "https://www.culturamapocho.cl/wp-content/uploads/2015/05/el-golf-1.jpg",
      "https://culturizarte.cl/wp-content/uploads/2020/08/Fachadas-Agosto-12.jpg",
      "https://www.tmlascondes.cl/wp-content/uploads/2025/08/2012-CONCIERTO-DE-NAVIDAD-U.MAYOR_.jpg",

    ],
    schedule: {
      open: "09:00",
      close: "20:00",
    },
    keywords: ["Gastronomía", "Cultura"],
    shortDescription: 'El Barrio El Golf se encuentra en la comuna de Las Condes, en el oriente de Santiago. Este barrio combina un pasado aristocrático —con mansiones de los años 30 y 40— con una actualidad de rascacielos, oficinas de empresas importantes y una de las más dinámicas ofertas de gastronomía y cultura de la ciudad. Es famoso también por sus avenidas clave, como Isidora Goyenechea, repleta de restaurantes, cafés y bares. Además, el sector destaca por su vida cultural, con espacios como el Teatro Municipal de Las Condes, el Museo Interactivo Las Condes (MUI) y el Museo Histórico Militar, que complementan su propuesta urbana moderna con arte, historia y experiencias interactivas únicas.',
    recommendations: [ {
      category: 'Cultura',
      items: ['Museo Interactivo Las Condes (MUI)','Museo Histórico y Militar','Teatro Municipal de las Condes'],
    },
    {
      category: 'Gastronomía',
      items: ['Ciros Bar (Nacional)','La Flaca MUT (Nacional)','La Cabrera','Tanta','Margó', 'Le Due Torri','Pizzería Tiramisú'],
    }]
  },
  {
    id: 'Triana',
    name: 'Barrio Triana',
    coordinates: [
      { latitude: -33.43246378880499, longitude: -70.6250690713465},
      { latitude: -33.43315009618783, longitude: -70.62583501855782 },
      { latitude: -33.434273744597206, longitude:  -70.62448050138413 },
      { latitude: -33.4336816442547, longitude: -70.62331142406161},
      { latitude: -33.43339232102713, longitude: -70.62343236309496 },
    ],
    fillColor: 'rgba(159, 123, 255, 0.2)',
    strokeColor: 'rgba(159, 123, 255, 0.6)',
    photos: ["https://providencia.cl/provi/site/artic/20250522/imag/foto_0000000320250522100211/BARRIO_TRIANA_DIA_DEL_PATRIMONIO_CALLE_TRIANA-32_1.jpg",
      "https://providencia.cl/provi/site/artic/20250522/imag/foto_0000000120250522100211/bellavista_teatro_2.jpg",
      "https://www.latercera.com/resizer/v2/PH6RVKMAFVAJ5JFDKYVPM43KRQ.jpg?auth=7f5a913ac8682549cff8e17aee3552c4e24e8f40d8c51d836efedced4681e139&smart=true&width=800&height=533&quality=70",
    ],
    schedule: {
      open: "08:00",
      close: "00:00",
    },
    keywords: ["Arquitectura", "Patrimonio","Cultura", "Gastronomía"],
    shortDescription: '“Ubicado en Providencia, en torno a la calle Triana, este barrio ha crecido como un espacio de talleres, ferias y actividades culturales de pequeña escala. Sus calles interiores reúnen tiendas, librerías, oficios y algunas cafeterías, con un perfil más familiar y barrial. Es apropiado para quienes prefieren recorridos tranquilos, en un entorno que mezcla lo residencial con una oferta cultural emergente. Su arquitectura está inspirada en pueblos franceses y las construcciones datan de la primera mitad del siglo XX.”',
    recommendations: [{
      category: 'Cultura',
      items: ['Centro Cultural de España'],
    },
    {
      category: 'Comida',
      items: ['Juan y Medio (Nacional)', 'Casino Latriana','OCULTO BEERGARDEN','Pizzeria Da Bruno','Casa Lola Restobar','Kame House', 'Arcano Bar','BE eme Café'],
    }],
  },
  {
    id: 'Franklin',
    name: 'Barrio Franklin',
    coordinates: [
      { latitude: -33.47463572630118, longitude: -70.63500460706025 },
      { latitude: -33.46990344526439, longitude: -70.6362995670762 },
      { latitude: -33.47131801287048, longitude: -70.65134576916604 },
      { latitude: -33.471549485371334, longitude: -70.65140743392871 },
      { latitude: -33.471858114410686, longitude: -70.65439817491789 },
      { latitude: -33.47661600633514, longitude: -70.6540281863419 },
      { latitude: -33.476744594382836, longitude: -70.64823169865154 },
      { latitude: -33.47625595878632, longitude: -70.6401227823613 },
    ],
    fillColor: 'rgba(159, 123, 255, 0.2)',
    strokeColor: 'rgba(159, 123, 255, 0.6)',
    photos: ["https://ohstgo.cl/wp-content/uploads/2021/12/SANTIAGO_Santiago-Bajo-Fuego-x1-1035x687.jpg",
      "https://factoria-franklin.cl/wp-content/uploads/2024/04/ani02.jpg",
      "https://factoria-franklin.cl/wp-content/uploads/2023/10/feria-aparte-destacada-1.jpg",
      "https://content-viajes.nationalgeographic.com.es/medio/2022/04/11/barrio-de-oficios_6af9c36d_2000x1500.jpg",
    ],
    schedule: {
      open: "09:00",
      close: "21:00",
    },
    keywords: ["Mercados", "Arte", "Gastronomía", "Antigüedades"],
    shortDescription: '"Barrio tradicional al sur del centro de Santiago, conocido por el Persa Bío Bío y su red de galpones llenos de antigüedades, ropa usada, música, libros y comida. Se ha revitalizado en los últimos años con espacios culturales como la Factoría Franklin, que combina arte, gastronomía y oficios contemporáneos. Es un lugar muy concurrido los fines de semana, especialmente por quienes buscan exploración urbana, compras informales o descubrir iniciativas independientes."',
    recommendations: [{
      category: 'Comida',
      items: ['Persa Bio Bio', 'Mercado Matadero','Persa Victor Manuel','Parrillada el Llano','El Pipeño','Bar Chiloé'],
    },
    {
      category: 'Cultura',
      items: ['Bar Victoria','Factoria Franklin'],
    },
    {
      category: 'Vida Nocturna',
      items: ['Nova Cero'],
    }],
  },
  {
    id: 'París Londres',
    name: 'Barrio París Londres',
    coordinates: [
      { latitude: -33.44549943690642, longitude: -70.64712662889296},
      { latitude: -33.443144958590985, longitude: -70.64717578722913 },
      { latitude: -33.443834080810234, longitude:  -70.64954521903292},
      { latitude: -33.44589321101409, longitude: -70.6491519523435 },
    ],
    fillColor: 'rgba(159, 123, 255, 0.2)',
    strokeColor: 'rgba(159, 123, 255, 0.6)',
    photos: ["https://cloudfront-us-east-1.images.arcpublishing.com/copesa/R6BOTAURKZD3BFWPVBRYE7KXSU.jpg",
      "https://www.latercera.com/resizer/v2/Y24OK2TLSZFTLPZRXGVDYHTZCM.jpg?auth=a584b9eac3b890cfe3e13baf0ef9405baf45582e35e375cf6329e5437f0f94dc&smart=true&width=800&height=450&quality=70",
      "https://www.rockandpop.cl/wp-content/uploads/2025/05/Mercado-Paris-Londres-web.webp",
      "https://cloudfront-us-east-1.images.arcpublishing.com/copesa/MPQNTFOXDBDPXH5EZFEM67KF2Q.jpg",
    ],
    schedule: {
      open: "10:00",
      close: "19:00",
    },
    keywords: ["Patrimonio", "Arquitectura", "Cafés", "Vida Nocturna"],
    shortDescription: 'Pequeño sector patrimonial en pleno centro de Santiago, caracterizado por su arquitectura de inspiración europea y callejones adoquinados. Es un lugar de paso breve, ideal para caminar y observar detalles arquitectónicos, con algunos cafés, tiendas y espacios de diseño. Su ambiente es tranquilo y su escala íntima lo hace atractivo para caminantes y fotógrafos. Además, una vez al mes se realiza el "Mercado París-Londres", un evento que une arte, música y vida urbana, transformando sus calles en un punto de encuentro para creadores, vecinos y visitantes que buscan disfrutar del patrimonio de manera viva y contemporánea.',
    recommendations: [{
      category: 'Comida',
      items: ['Club París', 'Londres 45','Bristol Restaurant'],
    },
    {
      category: 'Cultura',
      items: ['Espacio Londres','Museo San Francisco','Centro Cultural CEINA', 'Londres 38', 'Casa de los Diez'],
    },
    {
      category: 'Patrimonio',
      items: ['Iglesia de San Francisco', 'Museo San Francisco','Sociedad Chilena de Historia y Geografía'],
    },
    {
      category: 'Vida Nocturna',
      items: ['Club Orixas'],
    }],
  },
  {
    id: 'Bellavista',
    name: 'Barrio Bellavista',
    coordinates: [
      { latitude: -33.4341438228123, longitude:  -70.6327916113611},
      { latitude: -33.431832559057405, longitude: -70.63375145085328},
      { latitude: -33.43131522804357, longitude: -70.63423137060063},
      { latitude: -33.43046357726609, longitude: -70.63623152096957},
      { latitude: -33.42794256291342, longitude: -70.63968668711246},
      { latitude: -33.428945918525166, longitude: -70.64166684082572},
      { latitude: -33.43347352186487, longitude:  -70.64247506682457},
      { latitude: -33.43465386383628, longitude:  -70.63873702158678},
      { latitude: -33.43485620658712, longitude:  -70.63556473453487},
    ],
    fillColor: 'rgba(159, 123, 255, 0.2)',
    strokeColor: 'rgba(159, 123, 255, 0.6)',
    photos: [
      "https://a.travel-assets.com/findyours-php/viewfinder/images/res70/68000/68595-Bellavista.jpg",
      "https://disfrutasantiago.cl/wp-content/uploads/2022/11/barrio_bellavista-scaled.jpg",
      "https://observatoriocielosur.cl/wp-content/uploads/2024/03/Bellavista-El-barrio-mas-divertido-de-Santiago-1.jpg",
      "https://www.santiagoregion.com/uploads/fotos/foto_1242_c.jpg",
      "https://disfrutasantiago.cl/barrio-bellavista/bellavista_05/",
      "https://images.myguide-cdn.com/chile/companies/bellavista-neighborhood/large/bellavista-neighborhood-637244.jpg",
    ],
    schedule: {
      open: "10:00",
      close: "4:00",
    },
    keywords: ["Vida Nocturna", "Gastronomía", "Patrimonio"],
    shortDescription: 'Barrio ubicado entre el cerro San Cristóbal y el río Mapocho, con un carácter diverso que combina residencias antiguas, centros culturales, ferias artesanales y una amplia vida nocturna. Durante el día, es común ver recorridos turísticos hacia la Casa Museo La Chascona o el acceso al Parque Metropolitano; por la noche, se activa con una oferta extensa de locales de entretenimiento. Es un sector concurrido y heterogéneo, que convoca a quienes buscan actividades culturales y recreativas en un solo lugar.',
    recommendations: [
      {
        category: 'Cultura',
        items: ['Sala SCD Bellavista', 'Museo La Chascona','Thelonious Club de Jazz', 'Teatro San Ginés', 'Sala Metronomo', 'Teatro Mori Recoleta', 'Teatro Bellavista', 'Teatro Sidarte'],
      },
      {
        category: 'Vida Nocturna',
        items: ['La Feria','Club Room','Teatro Fiebre Bar','Club 57', 'Arcade Bar','MATRIX','Limon Stgo'],
      },
      {
        category: 'Comida',
        items: ['Mesón Nerudiano', 'Patio Bellavista', 'Terrazas San Cristobal', 'Galindo'],
      },
      {
        category: 'Patrimonio',
        items: ['Ex Cervecería Ebner', 'Fuente Alemana', 'Plaza Baquedano'],
      }],
  },
  {
    id: 'Suecia',
    name: 'Barrio Suecia',
    coordinates: [
      { latitude: -33.42027953387791, longitude: -70.60709301617966 },
      { latitude: -33.42128318401832, longitude: -70.60908309026684 },
      { latitude: -33.41963390484867, longitude: -70.61029260525974},
      { latitude: -33.41855230444424, longitude: -70.60910429087672 },
    ],
    fillColor: 'rgba(159, 123, 255, 0.2)',
    strokeColor: 'rgba(159, 123, 255, 0.6)',
    photos: ["https://upload.wikimedia.org/wikipedia/commons/1/18/Barrio_Suecia%2C_Providencia%2C_Santiago_20230422_01.jpg",
      "https://teatrooriente.cl/wp-content/uploads/2022/10/boleteria.jpg",
      "https://lacasadejuana.cl/wp-content/uploads/2018/10/hito_oct_01.jpg",
      "https://cloudfront-us-east-1.images.arcpublishing.com/copesa/X3AJKGCEXVGNHLYFD4K3XT4U5M.jpg",
    ],
    schedule: {
      open: "09:00",
      close: "00:00",
    },
    keywords: ["Cultura", "Gastronomía", "Mercado"],
    shortDescription: '"Barrio tradicional al sur del centro de Santiago, conocido por el Persa Bío Bío y su red de galpones llenos de antigüedades, ropa usada, música, libros y comida. Se ha revitalizado en los últimos años con espacios culturales como la Factoría Franklin, que combina arte, gastronomía y oficios contemporáneos. Es un lugar muy concurrido los fines de semana, especialmente por quienes buscan exploración urbana, compras informales o descubrir iniciativas independientes."',
    recommendations: [{
      category: 'Comida',
      items: ['Fuente Chilena','Villa Real','Baco', 'Brusels Chocolate','Piso Uno'],
    },
    {
      category: 'Cultura',
      items: ['Teatro Oriente','Museo Parque de las Esculturas'],
    },
    {
      category: 'Vida Nocturna',
      items: ['Club Subterráneo'],
    }],
  },
];

export default barrios;


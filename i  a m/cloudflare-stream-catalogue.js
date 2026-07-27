(function () {
  const CUSTOMER_HOST = "customer-1vpwglz3v6fiyaas.cloudflarestream.com";
  const UPLOADS = {
    " Sasha - Ibiza Boat at Sunset - Freqways.mp4": "d328b01e1d577c082facbb65c159b116",
    "Annie's Ibiza.mp4": "30b3a8a9a753d23f089f480689bd14f6",
    "Ben Böhmer live - Cappadocia, Turkey - Cercle.mp4": "8db5f9511d39139c1f3e0b1dbdda4474",
    "Björk - Hyperballad.mp4": "950d50bf4e6a880c7455b25754d5e4f4",
    "Billy Idol - Eyes Without A Face.mp4": "6079e8e9ff406dc5e3b036f9df8242ce",
    "Carl Cox - Château de Chambord, France - Cercle.mp4": "6551c49b117a51123ea7909455caa65f",
    "Caroline Polachek - Welcome To My Island.mp4": "82e8b28ae470efe228bcdc831a16c956",
    "Chanel - Paris 2020.mp4": "f6eefc5a83e53f24990a7477ecd04010",
    "Charli XCX - House featuring John Cale.mp4": "cc7fa2de6d0333d63064f364830aeb72",
    "Dua Lipa - Be The One.mp4": "faf51e94a65e76d5fe46f70bb58005f5",
    "Dolce & Gabbanna - Sicily 2019.mp4": "b582b1bff1de6e3952f815b9e2f79ebc",
    "D I G Two Way Dreamtime.mp4": "ff80e2452cc9a8781c09070ba7b6882e",
    "Dave Dobbyn - Slice of Heaven.mp4": "fd1197c35a1d050846124def4d79c04d",
    "David Bowie - Fashion.mp4": "61aa02fa6544ab7b2ccd5be88fc274f6",
    "Don Henley - The Boys Of Summer.mp4": "79a793ca8abc307e78a14221bc4ecb34",
    "Echo & The Bunnymen - The Killing Moon.mp4": "edbb056c0a295753a79c8b41d5122b2e",
    "Eurythmics - Here Comes The Rain Again.mp4": "a4f7350e7ef712c8e12d41edcff93c27",
    "Flume - Never Be Like You feat. Kai [ Live at Laneway Festival ].mp4": "6768454558383ed9b6a8be6554b07ef7",
    "Flume - Tiny Cities feat. Beck.mp4": "8c93a0419c8da7f73bb601d8dfd53943",
    "Fleetwood Mac - Everywhere.mp4": "aa4e1c6c9d63e4ed6a92037d753134da",
    "Femininity Explored - Power, Sex, & Intimacy, with Vylana.mp4": "ef8bbcd95a067bbc294d0d493b93fabc",
    "From Doula to Stripper - Reclaiming the Forbidden Feminine with Caitlin Erica.mp4": "9162e29e524b6db596d72d8c9720729d",
    "Globe Landing Page Video - Sunscreem - Perfection Motion for RMU.mp4": "fd142ca0e1672dd7a92729857db1facd",
    "Grimes - Genesis.mp4": "e6a813342812c4039b48aff744f64304",
    "Gerry Rafferty - Baker Street.mp4": "38d0a05ae045cf99f369277b09e91ab7",
    "Healthy Sexuality Vs. Healing Sexuality - Teal Swan.mp4": "b35b5890ca38c7b99bfc7adaae5bc16c",
    "Homepage - Hero Background Video - Chanel 2020 Runway Show.mp4": "d86c877dafcfacfcda49aa40ed08ab57",
    "ISS - The Blue Pearl.mp4": "08d6983ef6584f2b8659ceaf0cfa248a",
    "ICEHOUSE - Electric Blue.mp4": "e268a70974dc3fe8e57d73cbb45ab9f6",
    "INXS - Don't Change.mp4": "c2798773d4d87e3c8b4d7e9e02bdb83f",
    "JACQUEMUS - SS20 LE COUP DE SOLEIL.mp4": "00fe2d47012a31b3b0796fcf2e544360",
    "Jacqueline Michell - Healing Through Solo Rope & Self Pleasure.mp4": "7f60e29d9e432bf4198df7dc223b66ef",
    "Karl Lagerfeld - The Making of the 2011 Pirelli Calendar.mp4": "f9eb03d0f256739628addbb7ab66b7ed",
    "Kate Bush - Running Up That Hill.mp4": "d2b7246f4e982309ad26f079716ce915",
    "Linkin Park - Numb (Live, 2024).mp4": "91072eec8efdeb2d2e2a18e1a0f2ea5d",
    "Linkin Park - Numb.mp4": "1fbfae86a89fb8798e736c0394e0f77a",
    "Little Simz - Gorilla.mp4": "15e3ba715d1e95c483a08f0665dcb0c3",
    "M.I.A. - Borders.mp4": "72194540ee128c6de0ce26da63f220c1",
    "Madonna - Frozen.mp4": "722da24280e5ee6617e01c47d1689278",
    "Madonna - Ray Of Light.mp4": "4c91276cedb006ba1b30b8b8f978a851",
    "Men At Work - Who Can It Be Now.mp4": "4eb95e6ed02bb1ba4370d5ce8ce54fd0",
    "Max Richter live at Cercle Odyssey, Paris, France.mp4": "2519e10718345a02e793736dde912307",
    "Miss Monique - Biosphere Museum in Montreal, Canada - Cercle.mp4": "2b14fa4819e45f2389e332bcf5da784e",
    "Mondo Rock - Come Said The Boy.mp4": "46dfff07c7055ea713be6fe202e2d297",
    "Mugler - Fall Winter 2021.mp4": "792c884e5d63177f32dd85a2f7e97c28",
    "NASTIA - Ibiza at Sunset - The Lab.mp4": "136ec1e0ea6fab6cf3b2823c0f1c91a4",
    "Nina Kraviz - Eiffel Tower, Paris, France - Cercle.mp4": "ddd5d833455f0710e35b8a7a86cd6479",
    "Nightmares On Wax - Shape The Future.mp4": "8f62532e4e436ce5e173334187666c56",
    "Ólafur Arnalds live from Hafursey, in Iceland for Cercle.mp4": "ab3bad1d63041842c5a485b0e6f04381",
    "PinkPantheress - Illegal ( Live at Glastonbury).mp4": "d8b7080ac4fb2d0acfeb6244ca076a0a",
    "Peggy Gou - Cercle - Palais des Beaux - Cercle.mp4": "deffc6cd21e8ab75deaa6bf01eaf841c",
    "Peter Gabriel - Sledgehammer.mp4": "d27b2cbadecf9e82bb1ae4f87566bb0f",
    "Phil Collins - In The Air Tonight.mp4": "d75e5205f40538c5ea95774d0fc879a4",
    "Rihanna - Diamonds.mp4": "e5186fe7cb7bf9c7e3496104f83084aa",
    "Sampa The Great - Energy (feat. Nadeem Din-Gabisi).mp4": "f57b86dcf16f87953c1bb4ea0598a601",
    "Sampa The Great - Final Form.mp4": "32b3a112597ecd17905e280f5a6d1570",
    "Solange - Cranes in the Sky.mp4": "d81f3a7e9ffa9bbbb7420b0f020cbfd2",
    "Tears For Fears - Head Over Heels.mp4": "c172b678ede9d181b364254edb950468",
    "The Church - Under The Milky Way.mp4": "19712d560f74ab319f60a224686dc7e1",
    "The Smiths - How Soon Is Now.mp4": "868cb171465d3b5f9987e3525ff9853e",
    "Time Bandits - I'm Only Shooting Love.mp4": "5df603b212bf6f86012b33afb42208bd",
    "Toto - Africa.mp4": "e9e7a71c6463d30ad68153a87caf8666",
    "Tame Impala - The Less I Know The Better.mp4": "fe21473d2b3980739ff1046b819a6ef0",
    "The Psychology of boring sex with Shashi Solluna - Tantra - Expanding The Window of Pleasure.mp4": "af6f972e12eb0e9317a0d4e0d694b382",
    "The Prodigy - Everybody In The Place.mp4": "e8d1ffe1bb389abb17b29099424d4afa",
    "The Truth About Tantra, Sacred Union & Embodied Wealth - Sofia Sundari.mp4": "a821a9447efb3dd9381008eafac0ff78",
    "U2 - Numb.mp4": "f903cfefe0fd849f4cb54fab4b9e851b",
    "Wolford x Sergio Rossi.mp4": "90c027288fe81ad915971988aafebafd",
    "Zip (Perlon) - Air Festival, 2007.mp4": "16beb0de56b4924810211bae6d917ebb",
    "Zip & Sammy D (Perlon) - Betalounge, 2000.mp4": "f1257734ca8ee5702b3022619db360cd",
  };

  function fileNameFromPath(value) {
    const clean = String(value || "").split("?")[0];
    return decodeURIComponent(clean.slice(clean.lastIndexOf("/") + 1));
  }

  function assetFor(value) {
    const fileName = UPLOADS[value] ? value : fileNameFromPath(value);
    const uid = UPLOADS[fileName];
    if (!uid) return null;
    return {
      fileName,
      uid,
      hls: `https://${CUSTOMER_HOST}/${uid}/manifest/video.m3u8`,
      dash: `https://${CUSTOMER_HOST}/${uid}/manifest/video.mpd`,
      watch: `https://${CUSTOMER_HOST}/${uid}/watch`,
    };
  }

  window.IAMCloudflareStream = Object.freeze({
    customerHost: CUSTOMER_HOST,
    uploads: Object.freeze({ ...UPLOADS }),
    assetFor,
    fileNameFromPath,
  });
}());

(function () {
  const CUSTOMER_HOST = "customer-1vpwglz3v6fiyaas.cloudflarestream.com";
  const UPLOADS = {
    " Sasha - Ibiza Boat at Sunset - Freqways.mp4": "d328b01e1d577c082facbb65c159b116",
    "Ben Böhmer live - Cappadocia, Turkey - Cercle.mp4": "8db5f9511d39139c1f3e0b1dbdda4474",
    "Björk - Hyperballad.mp4": "950d50bf4e6a880c7455b25754d5e4f4",
    "Carl Cox - Château de Chambord, France - Cercle.mp4": "6551c49b117a51123ea7909455caa65f",
    "Caroline Polachek - Welcome To My Island.mp4": "82e8b28ae470efe228bcdc831a16c956",
    "Chanel - Paris 2020.mp4": "f6eefc5a83e53f24990a7477ecd04010",
    "Charli XCX - House featuring John Cale.mp4": "cc7fa2de6d0333d63064f364830aeb72",
    "Dua Lipa - Be The One.mp4": "faf51e94a65e76d5fe46f70bb58005f5",
    "Dolce & Gabbanna - Sicily 2019.mp4": "b582b1bff1de6e3952f815b9e2f79ebc",
    "Flume - Never Be Like You feat. Kai [ Live at Laneway Festival ].mp4": "6768454558383ed9b6a8be6554b07ef7",
    "Flume - Tiny Cities feat. Beck.mp4": "8c93a0419c8da7f73bb601d8dfd53943",
    "Globe Landing Page Video - Sunscreem - Perfection Motion for RMU.mp4": "fd142ca0e1672dd7a92729857db1facd",
    "Grimes - Genesis.mp4": "e6a813342812c4039b48aff744f64304",
    "Homepage - Hero Background Video - Chanel 2020 Runway Show.mp4": "d86c877dafcfacfcda49aa40ed08ab57",
    "Linkin Park - Numb (Live, 2024).mp4": "91072eec8efdeb2d2e2a18e1a0f2ea5d",
    "Linkin Park - Numb.mp4": "1fbfae86a89fb8798e736c0394e0f77a",
    "Little Simz - Gorilla.mp4": "15e3ba715d1e95c483a08f0665dcb0c3",
    "M.I.A. - Borders.mp4": "72194540ee128c6de0ce26da63f220c1",
    "Madonna - Frozen.mp4": "722da24280e5ee6617e01c47d1689278",
    "Madonna - Ray Of Light.mp4": "4c91276cedb006ba1b30b8b8f978a851",
    "Miss Monique - Biosphere Museum in Montreal, Canada - Cercle.mp4": "2b14fa4819e45f2389e332bcf5da784e",
    "NASTIA - Ibiza at Sunset - The Lab.mp4": "136ec1e0ea6fab6cf3b2823c0f1c91a4",
    "Nina Kraviz - Eiffel Tower, Paris, France - Cercle.mp4": "ddd5d833455f0710e35b8a7a86cd6479",
    "Nightmares On Wax - Shape The Future.mp4": "8f62532e4e436ce5e173334187666c56",
    "PinkPantheress - Illegal ( Live at Glastonbury).mp4": "d8b7080ac4fb2d0acfeb6244ca076a0a",
    "Peggy Gou - Cercle - Palais des Beaux - Cercle.mp4": "deffc6cd21e8ab75deaa6bf01eaf841c",
    "Rihanna - Diamonds.mp4": "e5186fe7cb7bf9c7e3496104f83084aa",
    "Sampa The Great - Energy (feat. Nadeem Din-Gabisi).mp4": "f57b86dcf16f87953c1bb4ea0598a601",
    "Sampa The Great - Final Form.mp4": "32b3a112597ecd17905e280f5a6d1570",
    "Solange - Cranes in the Sky.mp4": "d81f3a7e9ffa9bbbb7420b0f020cbfd2",
    "Tame Impala - The Less I Know The Better.mp4": "fe21473d2b3980739ff1046b819a6ef0",
    "The Prodigy - Everybody In The Place.mp4": "e8d1ffe1bb389abb17b29099424d4afa",
    "U2 - Numb.mp4": "f903cfefe0fd849f4cb54fab4b9e851b",
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

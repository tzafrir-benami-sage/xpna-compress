const apiUrl = process.env.API_URL;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getCollection = async (
  collection: string,
  limit: number,
  offset: number,
  compress: boolean
) => {
  const startTime = Date.now();

  const url = `${apiUrl}/objects/${collection}?limit=${limit}&offset=${offset}&compress=${compress}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Accept-Encoding": "gzip, deflate, br",
      "x-xpna-identity": JSON.stringify({
        userId: "1001",
        companyId: "test-company-0210",
      }),
    },
  });

  const body = await res.json();

  if (res.status !== 200) {
    console.error(`Error fetching collection: ${url}: ${res.status}`, body);
    return [];
  }

  const { items } = body as { items: { [key: string]: unknown }[] };

  const encoding = res.headers.get("content-encoding");
  const length = res.headers.get("content-length");

  const endTime = Date.now();
  console.debug(
    `Download [${collection}] collection (${
      items.length
    } items) in ${Math.floor(
      endTime - startTime
    )} milliseconds compress: ${compress} encoding: ${encoding} length: ${length})`
  );

  return items;
};

(async () => {
  const collections = ["plan-line", "dependency-edge"];

  for (const compress of [false, true]) {
    const plansDownloadStartTime = Date.now();
    const limit = compress ? 25000 : 10000;
    let offset = 0;
    for (const collection of collections) {
      const startTime = Date.now();
      let items = await getCollection(collection, limit, offset, compress);
      while (items.length > 0) {
        offset += items.length;
        items = await getCollection(collection, limit, offset, compress);
      }
      console.log(
        `finish download [${collection}] collection: ${offset} items in ${(
          Date.now() - startTime
        ).toLocaleString()} milliseconds (compress: ${compress})`
      );
    }
    console.log(
      `finish download plans in ${(
        Date.now() - plansDownloadStartTime
      ).toLocaleString()} milliseconds (compress: ${compress})`
    );
    await sleep(5000);
  }
})();

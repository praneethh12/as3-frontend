// Uses the API Gateway-generated SDK (SDK1): apigClient.js + lib/
const sdk = apigClientFactory.newClient({ apiKey: window.APP_CONFIG.API_KEY });
const $ = (id) => document.getElementById(id);

async function search(q) {
  const res = await sdk.searchGet({ q }, {}, {});
  return (res.data && res.data.results) || [];
}

function render(results) {
  const box = $("results");
  box.innerHTML = "";
  results.forEach((r) => {
    const fig = document.createElement("figure");
    const img = document.createElement("img");
    img.src = r.url;
    img.alt = (r.labels || []).join(", ");
    img.loading = "lazy";
    const cap = document.createElement("figcaption");
    cap.textContent = (r.labels || []).slice(0, 6).join(" · ");
    fig.append(img, cap);
    box.append(fig);
  });
}

$("search-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = $("q").value.trim();
  if (!q) return;
  $("status").textContent = "Searching…";
  try {
    const results = await search(q);
    render(results);
    $("status").textContent = results.length
      ? `${results.length} photo(s) found`
      : "No photos matched that search.";
  } catch (err) {
    $("status").textContent = "Search failed: " + (err.message || err);
  }
});

$("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = $("file").files[0];
  if (!file) return;
  const labels = $("labels").value
    .split(",").map((s) => s.trim()).filter(Boolean).join(", ");
  // key + Content-Type are modeled params in the SDK; customLabels goes in the same header set
  const params = { key: file.name, "Content-Type": file.type || "image/jpeg" };
  if (labels) params["x-amz-meta-customLabels"] = labels;
  $("upload-status").textContent = "Uploading…";
  try {
    await sdk.photosKeyPut(params, file, {});
    $("upload-status").textContent =
      "Uploaded! Indexing takes a few seconds, then it will appear in search.";
    $("upload-form").reset();
  } catch (err) {
    $("upload-status").textContent = "Upload failed: " + (err.message || err);
  }
});

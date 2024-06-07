document.addEventListener("DOMContentLoaded", loadExcelFile);
document
  .getElementById("generatePDF")
  .addEventListener("click", generatePDF, false);

let itemsData = [];

function loadExcelFile() {
  fetch("recetas.xlsx")
    .then((response) => response.arrayBuffer())
    .then((data) => {
      const workbook = XLSX.read(data, { type: "array" });
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        processExcelData(jsonData, sheetName);
      });
    });
}

function processExcelData(data, sheetName) {
  const processedData = data.slice(0).map((row) => {
    const item = row[0];
    const ingredientes = [1, 4, 7, 10, 13, 16]
      .map((i) => ({
        ingrediente: row[i],
        cantidad: parseFloat(row[i + 1]),
        unidad: row[i + 2],
      }))
      .filter((ing) => ing.ingrediente);

    return {
      item,
      ingredientes,
    };
  });

  itemsData.push(...processedData);
  displayItems(
    data
      .map((row) => row[0])
      .filter((value, index, self) => self.indexOf(value) === index),
    sheetName
  );
}

function displayItems(items, sheetName) {
  const container = document.getElementById("itemsContainer");
  const sheetContainer = document.createElement("div");
  sheetContainer.innerHTML = `<h2>${sheetName}</h2>`;
  items.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("item");
    div.innerHTML = `
            <label>
                <input type="checkbox" class="itemCheckbox" value="${item}">
                ${item}
            </label>
        `;
    sheetContainer.appendChild(div);
  });
  container.appendChild(sheetContainer);
}

function generatePDF() {
  const numInvitados = parseInt(
    document.getElementById("numInvitados").value,
    10
  );
  const selectedItems = Array.from(
    document.querySelectorAll(".itemCheckbox:checked")
  ).map((checkbox) => checkbox.value);

  const filteredData = itemsData.filter((data) =>
    selectedItems.includes(data.item)
  );
  const aggregatedData = aggregateData(filteredData, numInvitados / 100);

  const docDefinition = {
    content: [
      { text: "Ingredientes Calculados", style: "header" },
      ...aggregatedData.map((ingredient) => ({
        text: `${ingredient.ingrediente}: ${ingredient.cantidad.toFixed(2)} ${
          ingredient.unidad
        }`,
      })),
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
      },
    },
  };

  pdfMake.createPdf(docDefinition).download("Ingredientes.pdf");
}

function aggregateData(data, scaleFactor) {
  const aggregated = {};

  data.forEach(({ ingredientes }) => {
    ingredientes.forEach(({ ingrediente, cantidad, unidad }) => {
      if (!aggregated[ingrediente]) {
        aggregated[ingrediente] = { cantidad: 0, unidad };
      }
      aggregated[ingrediente].cantidad += cantidad * scaleFactor;
    });
  });

  return Object.keys(aggregated).map((key) => ({
    ingrediente: key,
    cantidad: aggregated[key].cantidad,
    unidad: aggregated[key].unidad,
  }));
}

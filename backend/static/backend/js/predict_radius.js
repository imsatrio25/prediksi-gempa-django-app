let map;  // Declare map variable outside the function to prevent re-initialization
let marker, circle;  // Declare variables to track marker and circle layers
let processedRows = 0;

// Function to determine circle color based on magnitude
function getColorByMagnitude(magnitude) {
    if (magnitude >= 7.0) {
        return 'red';        // Magnitude 7.0–7.9
    } else if (magnitude >= 6.1) {
        return 'orange';     // Magnitude 6.1–6.9
    } else if (magnitude >= 5.5) {
        return 'yellow';     // Magnitude 5.5–6.0
    } else {
        return 'lightyellow'; // Magnitude 2.5–5.4
    }
}

function predictRadius() {
    const magnitude = parseFloat(document.getElementById('magnitude').value);
    const depth = document.getElementById('depth').value;
    const phasecount = document.getElementById('phasecount').value;
    const mmi = document.getElementById('mmi').value;
    const latitude = parseFloat(document.getElementById("latitude").value);
    const longitude = parseFloat(document.getElementById("longitude").value);

    fetch(`/api/predict-radius/?magnitude=${magnitude}&depth=${depth}&latitude=${latitude}&longitude=${longitude}&phasecount=${phasecount}&mmi=${mmi}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('result').innerText = `Error: ${data.error}`;
            } else {
                const radiusKilometers = data.predicted_radius_kilometers;

                document.getElementById('result').innerText = 
                    `Estimasi radius kerusakan: (${radiusKilometers} km)`;

                // Initialize the map if it doesn't exist
                if (!map) {
                    map = L.map('map').setView([latitude, longitude], 7);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 18,
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(map);
                } else {
                    map.setView([latitude, longitude], 7);
                }

                // Remove existing marker and circle if present
                if (marker) map.removeLayer(marker);
                if (circle) map.removeLayer(circle);

                // Get color based on magnitude
                const circleColor = getColorByMagnitude(magnitude);

                // Add new marker and circle with color based on magnitude
                marker = L.marker([latitude, longitude]).addTo(map);
                marker.bindPopup(
                    `Estimasi radius kerusakan: ${radiusKilometers} km<br>` +
                    `Latitude: ${latitude}<br>` +
                    `Longitude: ${longitude}`).openPopup();

                circle = L.circle([latitude, longitude], {
                    color: circleColor,
                    radius: radiusKilometers * 1000,
                    fillOpacity: 0.2
                }).addTo(map);
            }
        })
        .catch(error => {
            document.getElementById('result').innerText = `Error: ${error}`;
        });
}

function uploadCSV() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    if (!file) {
        alert("Please upload a CSV file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const text = event.target.result;
        const rows = text.trim().split('\n');
        
        if (rows.length < 2) {
            alert("CSV file is empty or only contains a header.");
            return;
        }

        const headers = rows[0].split(',').map(header => header.trim().toLowerCase());
        const magIndex = headers.indexOf('magnitude');
        const depthIndex = headers.indexOf('depth');
        const mmiIndex = headers.indexOf('mmi');
        const phaIndex = headers.indexOf('phasecount');
        const latIndex = headers.indexOf('latitude');
        const lonIndex = headers.indexOf('longitude');

        if (magIndex === -1 || depthIndex === -1 || latIndex === -1 || lonIndex === -1) {
            alert("CSV file must contain 'magnitude', 'depth', 'latitude', and 'longitude' columns.");
            return;
        }

        const maxRows = Math.min(rows.length - 1, 10);
        const bounds = [];

        if (!map) {
            map = L.map('map').setView([0, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
        } else {
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker || layer instanceof L.Circle) {
                    map.removeLayer(layer);
                }
            });
        }

        const predictions = [];
        let processedCount = 0;

        rows.slice(1, maxRows + 1).forEach((row, index) => {
            const columns = row.split(',');

            const magnitude = parseFloat(columns[magIndex].trim());
            const depth = parseFloat(columns[depthIndex].trim());
            const phasecount = parseFloat(columns[phaIndex].trim());
            const mmi = parseFloat(columns[mmiIndex].trim());
            const latitude = parseFloat(columns[latIndex].trim());
            const longitude = parseFloat(columns[lonIndex].trim());

            if (isNaN(magnitude) || isNaN(depth) || isNaN(latitude) || isNaN(longitude)) {
                console.warn(`Skipping invalid row ${index + 2}: ${row}`);
                return;
            }

            fetch(`/api/predict-radius/?magnitude=${magnitude}&depth=${depth}&latitude=${latitude}&longitude=${longitude}&phasecount=${phasecount}&mmi=${mmi}`)
                .then(response => response.json())
                .then(data => {
                    if (!data.error) {
                        const radiusKilometers = data.predicted_radius_kilometers;
                        const circleColor = getColorByMagnitude(magnitude);

                        const marker = L.marker([latitude, longitude]).addTo(map);
                        marker.bindPopup(`Latitude: ${latitude}`);
                        marker.bindPopup(
                            `Estimasi radius kerusakan: ${radiusKilometers} km<br>` +
                            `Latitude: ${latitude}<br>`+
                            `Longitude: ${longitude}`).openPopup();

                        const circle = L.circle([latitude, longitude], {
                            color: circleColor,
                            radius: radiusKilometers * 1000,
                            fillOpacity: 0.2
                        }).addTo(map);

                        bounds.push([latitude, longitude]);

                        processedCount++;
                        if (processedCount === maxRows) {
                            map.fitBounds(bounds);
                        }
                    }
                })
                .catch(error => {
                    console.error(`Error in row ${index + 2}: ${error}`);
                });
        });
    };

    reader.readAsText(file);
}

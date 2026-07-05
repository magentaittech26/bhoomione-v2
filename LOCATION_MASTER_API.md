# India Location Master – API Reference

This document outlines the API endpoints added to the BhoomiOne Location Master module.

## Endpoints

All endpoints are prefix-secured and support the `projects.view` permission (default scope: `GET /api/v1/...`).

---

### 1. Fetch States & UTs
- **Route**: `GET /api/v1/location/states`
- **Response**: List of active states and Union Territories.

```json
[
  {
    "id": 11,
    "name": "Karnataka",
    "code": "KA",
    "type": "State",
    "latitude": "15.3173000",
    "longitude": "75.7139000",
    "is_active": 1
  }
]
```

---

### 2. Fetch Districts
- **Route**: `GET /api/v1/location/districts?state_id={id}`
- **Response**: List of districts within the selected state.

```json
[
  {
    "id": 3,
    "state_id": 11,
    "name": "Dharwad",
    "latitude": "15.4589000",
    "longitude": "75.0078000",
    "is_active": 1
  }
]
```

---

### 3. Fetch Taluks / Subdivision Tehsils
- **Route**: `GET /api/v1/location/taluks?district_id={id}`
- **Response**: List of taluks inside the district.

```json
[
  {
    "id": 4,
    "district_id": 3,
    "name": "Hubli",
    "latitude": "15.3647000",
    "longitude": "75.1240000",
    "is_active": 1
  }
]
```

---

### 4. Fetch Cities & Towns
- **Route**: `GET /api/v1/location/cities?district_id={id}`
- **Response**: List of cities in the district.

```json
[
  {
    "id": 4,
    "district_id": 3,
    "name": "Hubballi",
    "latitude": "15.3647000",
    "longitude": "75.1240000",
    "is_active": 1
  }
]
```

---

### 5. Fetch Villages & Localities
- **Route**: `GET /api/v1/location/villages?taluk_id={id}`
- **Response**: List of villages inside the taluk.

```json
[
  {
    "id": 7,
    "taluk_id": 4,
    "name": "Gokul Road",
    "latitude": "15.3725000",
    "longitude": "75.1011000",
    "is_active": 1
  }
]
```

---

### 6. Fetch PIN Codes
- **Route**: `GET /api/v1/location/pincodes?city_id={id}&village_id={id}`
- **Response**: Matching PIN codes.

```json
[
  {
    "id": 6,
    "pincode": "580030",
    "city_id": 4,
    "village_id": 7,
    "latitude": "15.3725000",
    "longitude": "75.1011000",
    "is_active": 1
  }
]
```

---

### 7. Fuzzy Universal Location Search
- **Route**: `GET /api/v1/location/search?q={query}`
- **Response**: Mixed fuzzy search results across states, districts, cities, villages, and PIN codes.

```json
[
  {
    "type": "pincode",
    "id": 6,
    "name": "580030",
    "subtitle": "PIN Code in Gokul Road, Hubballi"
  },
  {
    "type": "village",
    "id": 7,
    "name": "Gokul Road",
    "subtitle": "Village/Locality in Hubli, Dharwad, Karnataka"
  }
]
```

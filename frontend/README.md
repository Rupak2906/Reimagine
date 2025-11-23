# UW Student Housing Finder

A web application that aggregates student housing listings from multiple sources, making it easier for University of Wisconsin students to find their ideal accommodation.

## Features

- **Multi-Source Aggregation**: Combines listings from Campus Area Housing and UW Sublets
- **Smart Filtering**: Filter by price range, bedrooms, source, and keywords
- **Flexible Sorting**: Sort by price, bedrooms, availability, or date added
- **Auto-Update Cache**: Automatically refreshes data every hour for new listings
- **Responsive Design**: Beautiful, mobile-friendly interface

## Quick Start

### Option 1: Using the run script (Recommended)

```bash
chmod +x run.sh
./run.sh
```

### Option 2: Manual setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
cd backend
python app.py
```

Then open your browser to: **http://localhost:5000**

## Project Structure

```
claudehacks/
├── backend/
│   ├── app.py           # Flask application and API routes
│   ├── models.py        # Database models and operations
│   ├── scrapers.py      # Web scrapers for each source
│   └── config.py        # Configuration settings
├── frontend/
│   └── index.html       # Single-page web interface
├── requirements.txt     # Python dependencies
└── run.sh              # Quick start script
```

## API Endpoints

### GET /api/listings
Get all listings with optional filtering and sorting.

**Query Parameters:**
- `search`: Search term for title, description, or location
- `min_price`: Minimum price filter
- `max_price`: Maximum price filter
- `bedrooms`: Number of bedrooms
- `source`: Filter by source (campus_area_housing, uw_sublets)
- `sort_by`: Sort field (price, bedrooms, created_at, available_from)
- `sort_order`: Sort order (ASC, DESC)

**Example:**
```
GET /api/listings?min_price=500&max_price=1000&bedrooms=2&sort_by=price&sort_order=ASC
```

### GET /api/sources
Get available data sources.

### GET /api/stats
Get statistics about listings.

### POST /api/scrape
Manually trigger a data scrape.

## Data Strategy

- **New Data Scan**: Every 1 hour (configurable)
- **Cache Update**: Every 12 hours (configurable)
- **Storage**: SQLite database for persistent caching
- **Demo Mode**: Currently uses curated examples that match real listings

## Tech Stack

- **Backend**: Python, Flask
- **Database**: SQLite
- **Scraping**: BeautifulSoup4, Requests
- **Scheduling**: APScheduler
- **Frontend**: HTML, CSS, JavaScript (Vanilla)

## Configuration

Edit `backend/config.py` to customize:
- Scraping intervals
- Data sources
- Database location

## For Hackathon Demo

The application comes pre-loaded with curated example data that matches the structure of real listings from:
- Campus Area Housing (https://campusareahousing.wisc.edu/subleases)
- UW Sublets (https://www.uwsublets.com/)

To extend with real scraping, update the scraper functions in `backend/scrapers.py`.

## Future Enhancements

- Real-time web scraping implementation
- User accounts and saved searches
- Email notifications for new listings
- Map view integration
- Price trend analytics
- More data sources

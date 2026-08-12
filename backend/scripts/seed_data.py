"""
Seed dataset for Scout.
Real, publicly known football players/clubs/transfers, simplified and
approximated for demo purposes. Not exhaustive - enough breadth to make
multi-hop graph queries meaningful.
"""

CLUBS = [
    {"name": "FC Barcelona", "country": "Spain", "founded": 1899, "league": "La Liga"},
    {"name": "Real Madrid", "country": "Spain", "founded": 1902, "league": "La Liga"},
    {"name": "Manchester City", "country": "England", "founded": 1880, "league": "Premier League"},
    {"name": "Manchester United", "country": "England", "founded": 1878, "league": "Premier League"},
    {"name": "Liverpool", "country": "England", "founded": 1892, "league": "Premier League"},
    {"name": "Arsenal", "country": "England", "founded": 1886, "league": "Premier League"},
    {"name": "Chelsea", "country": "England", "founded": 1905, "league": "Premier League"},
    {"name": "Bayern Munich", "country": "Germany", "founded": 1900, "league": "Bundesliga"},
    {"name": "Borussia Dortmund", "country": "Germany", "founded": 1909, "league": "Bundesliga"},
    {"name": "Paris Saint-Germain", "country": "France", "founded": 1970, "league": "Ligue 1"},
    {"name": "Juventus", "country": "Italy", "founded": 1897, "league": "Serie A"},
    {"name": "Inter Milan", "country": "Italy", "founded": 1908, "league": "Serie A"},
    {"name": "AC Milan", "country": "Italy", "founded": 1899, "league": "Serie A"},
    {"name": "Atletico Madrid", "country": "Spain", "founded": 1903, "league": "La Liga"},
    {"name": "Napoli", "country": "Italy", "founded": 1926, "league": "Serie A"},
]

LEAGUES = [
    {"name": "La Liga", "country": "Spain", "tier": 1},
    {"name": "Premier League", "country": "England", "tier": 1},
    {"name": "Bundesliga", "country": "Germany", "tier": 1},
    {"name": "Ligue 1", "country": "France", "tier": 1},
    {"name": "Serie A", "country": "Italy", "tier": 1},
]

AGENTS = [
    {"name": "Jorge Mendes", "agency": "Gestifute"},
    {"name": "Mino Raiola Estate", "agency": "Raiola Sports Management"},
    {"name": "Pini Zahavi", "agency": "Independent"},
    {"name": "Kia Joorabchian", "agency": "Roc Nation Sports"},
    {"name": "Fali Ramadani", "agency": "Lian Sports"},
    {"name": "Rafaela Pimenta", "agency": "Rafaela Pimenta Consulting"},
]

MANAGERS = [
    {"name": "Pep Guardiola", "nationality": "Spain"},
    {"name": "Jurgen Klopp", "nationality": "Germany"},
    {"name": "Carlo Ancelotti", "nationality": "Italy"},
    {"name": "Xavi Hernandez", "nationality": "Spain"},
    {"name": "Erik ten Hag", "nationality": "Netherlands"},
    {"name": "Thomas Tuchel", "nationality": "Germany"},
    {"name": "Mikel Arteta", "nationality": "Spain"},
]

# Players with career history embedded (clubs + years + agent)
PLAYERS = [
    {
        "name": "Lionel Messi", "position": "Forward", "nationality": "Argentina",
        "birth_year": 1987, "market_value": 25000000, "agent": "Pini Zahavi",
        "history": [
            {"club": "FC Barcelona", "from_year": 2004, "to_year": 2021, "appearances": 778, "goals": 672},
            {"club": "Paris Saint-Germain", "from_year": 2021, "to_year": 2023, "appearances": 75, "goals": 32},
        ],
        "transfers": [
            {"club": "Paris Saint-Germain", "year": 2021, "fee": 0, "transfer_type": "free"},
        ],
    },
    {
        "name": "Ousmane Dembele", "position": "Forward", "nationality": "France",
        "birth_year": 1997, "market_value": 50000000, "agent": "Moussa Sissoko Sports",
        "history": [
            {"club": "Borussia Dortmund", "from_year": 2016, "to_year": 2017, "appearances": 49, "goals": 10},
            {"club": "FC Barcelona", "from_year": 2017, "to_year": 2023, "appearances": 185, "goals": 40},
            {"club": "Paris Saint-Germain", "from_year": 2023, "to_year": None, "appearances": 60, "goals": 25},
        ],
        "transfers": [
            {"club": "FC Barcelona", "year": 2017, "fee": 105000000, "transfer_type": "permanent"},
            {"club": "Paris Saint-Germain", "year": 2023, "fee": 50000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Erling Haaland", "position": "Forward", "nationality": "Norway",
        "birth_year": 2000, "market_value": 180000000, "agent": "Rafaela Pimenta",
        "history": [
            {"club": "Borussia Dortmund", "from_year": 2020, "to_year": 2022, "appearances": 89, "goals": 86},
            {"club": "Manchester City", "from_year": 2022, "to_year": None, "appearances": 120, "goals": 130},
        ],
        "transfers": [
            {"club": "Manchester City", "year": 2022, "fee": 60000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Jude Bellingham", "position": "Midfielder", "nationality": "England",
        "birth_year": 2003, "market_value": 180000000, "agent": "Rafaela Pimenta",
        "history": [
            {"club": "Borussia Dortmund", "from_year": 2020, "to_year": 2023, "appearances": 132, "goals": 24},
            {"club": "Real Madrid", "from_year": 2023, "to_year": None, "appearances": 90, "goals": 40},
        ],
        "transfers": [
            {"club": "Real Madrid", "year": 2023, "fee": 103000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Bukayo Saka", "position": "Forward", "nationality": "England",
        "birth_year": 2001, "market_value": 140000000, "agent": "Kia Joorabchian",
        "history": [
            {"club": "Arsenal", "from_year": 2018, "to_year": None, "appearances": 260, "goals": 75},
        ],
        "transfers": [],
    },
    {
        "name": "Declan Rice", "position": "Midfielder", "nationality": "England",
        "birth_year": 1999, "market_value": 120000000, "agent": "Kia Joorabchian",
        "history": [
            {"club": "Arsenal", "from_year": 2023, "to_year": None, "appearances": 70, "goals": 8},
        ],
        "transfers": [
            {"club": "Arsenal", "year": 2023, "fee": 116000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Kylian Mbappe", "position": "Forward", "nationality": "France",
        "birth_year": 1998, "market_value": 180000000, "agent": "Fali Ramadani",
        "history": [
            {"club": "Paris Saint-Germain", "from_year": 2017, "to_year": 2024, "appearances": 308, "goals": 256},
            {"club": "Real Madrid", "from_year": 2024, "to_year": None, "appearances": 50, "goals": 45},
        ],
        "transfers": [
            {"club": "Real Madrid", "year": 2024, "fee": 0, "transfer_type": "free"},
        ],
    },
    {
        "name": "Vinicius Junior", "position": "Forward", "nationality": "Brazil",
        "birth_year": 2000, "market_value": 200000000, "agent": "Fali Ramadani",
        "history": [
            {"club": "Real Madrid", "from_year": 2018, "to_year": None, "appearances": 280, "goals": 100},
        ],
        "transfers": [],
    },
    {
        "name": "Bernardo Silva", "position": "Midfielder", "nationality": "Portugal",
        "birth_year": 1994, "market_value": 60000000, "agent": "Jorge Mendes",
        "history": [
            {"club": "Manchester City", "from_year": 2017, "to_year": None, "appearances": 350, "goals": 60},
        ],
        "transfers": [],
    },
    {
        "name": "Cristiano Ronaldo", "position": "Forward", "nationality": "Portugal",
        "birth_year": 1985, "market_value": 15000000, "agent": "Jorge Mendes",
        "history": [
            {"club": "Manchester United", "from_year": 2003, "to_year": 2009, "appearances": 292, "goals": 118},
            {"club": "Real Madrid", "from_year": 2009, "to_year": 2018, "appearances": 438, "goals": 450},
            {"club": "Juventus", "from_year": 2018, "to_year": 2021, "appearances": 134, "goals": 101},
            {"club": "Manchester United", "from_year": 2021, "to_year": 2022, "appearances": 54, "goals": 27},
        ],
        "transfers": [
            {"club": "Real Madrid", "year": 2009, "fee": 94000000, "transfer_type": "permanent"},
            {"club": "Juventus", "year": 2018, "fee": 117000000, "transfer_type": "permanent"},
            {"club": "Manchester United", "year": 2021, "fee": 15000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Casemiro", "position": "Midfielder", "nationality": "Brazil",
        "birth_year": 1992, "market_value": 25000000, "agent": "Jorge Mendes",
        "history": [
            {"club": "Real Madrid", "from_year": 2013, "to_year": 2022, "appearances": 337, "goals": 24},
            {"club": "Manchester United", "from_year": 2022, "to_year": None, "appearances": 100, "goals": 8},
        ],
        "transfers": [
            {"club": "Manchester United", "year": 2022, "fee": 70000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Toni Kroos", "position": "Midfielder", "nationality": "Germany",
        "birth_year": 1990, "market_value": 10000000, "agent": "Independent Rep",
        "history": [
            {"club": "Bayern Munich", "from_year": 2007, "to_year": 2014, "appearances": 190, "goals": 27},
            {"club": "Real Madrid", "from_year": 2014, "to_year": 2024, "appearances": 460, "goals": 30},
        ],
        "transfers": [
            {"club": "Real Madrid", "year": 2014, "fee": 25000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Robert Lewandowski", "position": "Forward", "nationality": "Poland",
        "birth_year": 1988, "market_value": 15000000, "agent": "Pini Zahavi",
        "history": [
            {"club": "Borussia Dortmund", "from_year": 2010, "to_year": 2014, "appearances": 187, "goals": 103},
            {"club": "Bayern Munich", "from_year": 2014, "to_year": 2022, "appearances": 375, "goals": 344},
            {"club": "FC Barcelona", "from_year": 2022, "to_year": None, "appearances": 130, "goals": 90},
        ],
        "transfers": [
            {"club": "Bayern Munich", "year": 2014, "fee": 0, "transfer_type": "free"},
            {"club": "FC Barcelona", "year": 2022, "fee": 45000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Pedri", "position": "Midfielder", "nationality": "Spain",
        "birth_year": 2002, "market_value": 100000000, "agent": "Independent Rep",
        "history": [
            {"club": "FC Barcelona", "from_year": 2020, "to_year": None, "appearances": 190, "goals": 15},
        ],
        "transfers": [],
    },
    {
        "name": "Frenkie de Jong", "position": "Midfielder", "nationality": "Netherlands",
        "birth_year": 1997, "market_value": 60000000, "agent": "Ali Dursun",
        "history": [
            {"club": "FC Barcelona", "from_year": 2019, "to_year": None, "appearances": 230, "goals": 12},
        ],
        "transfers": [
            {"club": "FC Barcelona", "year": 2019, "fee": 86000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Antoine Griezmann", "position": "Forward", "nationality": "France",
        "birth_year": 1991, "market_value": 25000000, "agent": "Fali Ramadani",
        "history": [
            {"club": "Atletico Madrid", "from_year": 2014, "to_year": 2019, "appearances": 257, "goals": 133},
            {"club": "FC Barcelona", "from_year": 2019, "to_year": 2021, "appearances": 102, "goals": 35},
            {"club": "Atletico Madrid", "from_year": 2021, "to_year": None, "appearances": 150, "goals": 60},
        ],
        "transfers": [
            {"club": "FC Barcelona", "year": 2019, "fee": 120000000, "transfer_type": "permanent"},
            {"club": "Atletico Madrid", "year": 2021, "fee": 0, "transfer_type": "loan"},
        ],
    },
    {
        "name": "Marcus Rashford", "position": "Forward", "nationality": "England",
        "birth_year": 1997, "market_value": 60000000, "agent": "Kia Joorabchian",
        "history": [
            {"club": "Manchester United", "from_year": 2016, "to_year": None, "appearances": 380, "goals": 130},
        ],
        "transfers": [],
    },
    {
        "name": "Mohamed Salah", "position": "Forward", "nationality": "Egypt",
        "birth_year": 1992, "market_value": 65000000, "agent": "Ramy Abbas",
        "history": [
            {"club": "Chelsea", "from_year": 2014, "to_year": 2016, "appearances": 19, "goals": 2},
            {"club": "AC Milan", "from_year": 2015, "to_year": 2016, "appearances": 32, "goals": 5},
            {"club": "AS Roma", "from_year": 2016, "to_year": 2017, "appearances": 83, "goals": 34},
            {"club": "Liverpool", "from_year": 2017, "to_year": None, "appearances": 350, "goals": 220},
        ],
        "transfers": [
            {"club": "Liverpool", "year": 2017, "fee": 42000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Virgil van Dijk", "position": "Defender", "nationality": "Netherlands",
        "birth_year": 1991, "market_value": 30000000, "agent": "Independent Rep",
        "history": [
            {"club": "Liverpool", "from_year": 2018, "to_year": None, "appearances": 280, "goals": 20},
        ],
        "transfers": [
            {"club": "Liverpool", "year": 2018, "fee": 84000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Phil Foden", "position": "Midfielder", "nationality": "England",
        "birth_year": 2000, "market_value": 130000000, "agent": "Independent Rep",
        "history": [
            {"club": "Manchester City", "from_year": 2017, "to_year": None, "appearances": 280, "goals": 65},
        ],
        "transfers": [],
    },
    {
        "name": "Gavi", "position": "Midfielder", "nationality": "Spain",
        "birth_year": 2004, "market_value": 90000000, "agent": "Independent Rep",
        "history": [
            {"club": "FC Barcelona", "from_year": 2021, "to_year": None, "appearances": 130, "goals": 8},
        ],
        "transfers": [],
    },
    {
        "name": "Neymar Jr", "position": "Forward", "nationality": "Brazil",
        "birth_year": 1992, "market_value": 60000000, "agent": "Pini Zahavi",
        "history": [
            {"club": "FC Barcelona", "from_year": 2013, "to_year": 2017, "appearances": 186, "goals": 105},
            {"club": "Paris Saint-Germain", "from_year": 2017, "to_year": 2023, "appearances": 173, "goals": 118},
        ],
        "transfers": [
            {"club": "Paris Saint-Germain", "year": 2017, "fee": 222000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Raphael Varane", "position": "Defender", "nationality": "France",
        "birth_year": 1993, "market_value": 15000000, "agent": "Independent Rep",
        "history": [
            {"club": "Real Madrid", "from_year": 2011, "to_year": 2021, "appearances": 360, "goals": 15},
            {"club": "Manchester United", "from_year": 2021, "to_year": 2024, "appearances": 90, "goals": 3},
        ],
        "transfers": [
            {"club": "Manchester United", "year": 2021, "fee": 42000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Achraf Hakimi", "position": "Defender", "nationality": "Morocco",
        "birth_year": 1998, "market_value": 70000000, "agent": "Jorge Mendes",
        "history": [
            {"club": "Real Madrid", "from_year": 2016, "to_year": 2020, "appearances": 40, "goals": 1},
            {"club": "Borussia Dortmund", "from_year": 2018, "to_year": 2020, "appearances": 68, "goals": 12},
            {"club": "Inter Milan", "from_year": 2020, "to_year": 2021, "appearances": 51, "goals": 7},
            {"club": "Paris Saint-Germain", "from_year": 2021, "to_year": None, "appearances": 150, "goals": 15},
        ],
        "transfers": [
            {"club": "Paris Saint-Germain", "year": 2021, "fee": 60000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Joao Cancelo", "position": "Defender", "nationality": "Portugal",
        "birth_year": 1994, "market_value": 40000000, "agent": "Jorge Mendes",
        "history": [
            {"club": "Juventus", "from_year": 2018, "to_year": 2019, "appearances": 37, "goals": 1},
            {"club": "Manchester City", "from_year": 2019, "to_year": 2023, "appearances": 148, "goals": 6},
        ],
        "transfers": [
            {"club": "Manchester City", "year": 2019, "fee": 65000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Ansu Fati", "position": "Forward", "nationality": "Spain",
        "birth_year": 2002, "market_value": 30000000, "agent": "Jorge Mendes",
        "history": [
            {"club": "FC Barcelona", "from_year": 2019, "to_year": None, "appearances": 100, "goals": 25},
        ],
        "transfers": [],
    },
    {
        "name": "William Saliba", "position": "Defender", "nationality": "France",
        "birth_year": 2001, "market_value": 80000000, "agent": "Kia Joorabchian",
        "history": [
            {"club": "Arsenal", "from_year": 2019, "to_year": None, "appearances": 150, "goals": 5},
        ],
        "transfers": [],
    },
    {
        "name": "Martin Odegaard", "position": "Midfielder", "nationality": "Norway",
        "birth_year": 1998, "market_value": 110000000, "agent": "Independent Rep",
        "history": [
            {"club": "Real Madrid", "from_year": 2015, "to_year": 2021, "appearances": 40, "goals": 3},
            {"club": "Arsenal", "from_year": 2021, "to_year": None, "appearances": 160, "goals": 35},
        ],
        "transfers": [
            {"club": "Arsenal", "year": 2021, "fee": 34000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Gabriel Jesus", "position": "Forward", "nationality": "Brazil",
        "birth_year": 1997, "market_value": 55000000, "agent": "Kia Joorabchian",
        "history": [
            {"club": "Manchester City", "from_year": 2017, "to_year": 2022, "appearances": 233, "goals": 95},
            {"club": "Arsenal", "from_year": 2022, "to_year": None, "appearances": 90, "goals": 20},
        ],
        "transfers": [
            {"club": "Arsenal", "year": 2022, "fee": 45000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Aurelien Tchouameni", "position": "Midfielder", "nationality": "France",
        "birth_year": 2000, "market_value": 90000000, "agent": "Fali Ramadani",
        "history": [
            {"club": "Real Madrid", "from_year": 2022, "to_year": None, "appearances": 120, "goals": 6},
        ],
        "transfers": [
            {"club": "Real Madrid", "year": 2022, "fee": 80000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Eduardo Camavinga", "position": "Midfielder", "nationality": "France",
        "birth_year": 2002, "market_value": 90000000, "agent": "Rafaela Pimenta",
        "history": [
            {"club": "Real Madrid", "from_year": 2021, "to_year": None, "appearances": 130, "goals": 5},
        ],
        "transfers": [
            {"club": "Real Madrid", "year": 2021, "fee": 31000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Kevin De Bruyne", "position": "Midfielder", "nationality": "Belgium",
        "birth_year": 1991, "market_value": 45000000, "agent": "Independent Rep",
        "history": [
            {"club": "Chelsea", "from_year": 2012, "to_year": 2014, "appearances": 12, "goals": 0},
            {"club": "Manchester City", "from_year": 2015, "to_year": None, "appearances": 350, "goals": 100},
        ],
        "transfers": [
            {"club": "Manchester City", "year": 2015, "fee": 68000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Rodri", "position": "Midfielder", "nationality": "Spain",
        "birth_year": 1996, "market_value": 130000000, "agent": "Jorge Mendes",
        "history": [
            {"club": "Atletico Madrid", "from_year": 2015, "to_year": 2019, "appearances": 100, "goals": 5},
            {"club": "Manchester City", "from_year": 2019, "to_year": None, "appearances": 250, "goals": 30},
        ],
        "transfers": [
            {"club": "Manchester City", "year": 2019, "fee": 70000000, "transfer_type": "permanent"},
        ],
    },
    {
        "name": "Youssoufa Moukoko", "position": "Forward", "nationality": "Germany",
        "birth_year": 2004, "market_value": 20000000, "agent": "Independent Rep",
        "history": [
            {"club": "Borussia Dortmund", "from_year": 2020, "to_year": None, "appearances": 70, "goals": 15},
        ],
        "transfers": [],
    },
    {
        "name": "Warren Zaire-Emery", "position": "Midfielder", "nationality": "France",
        "birth_year": 2006, "market_value": 60000000, "agent": "Fali Ramadani",
        "history": [
            {"club": "Paris Saint-Germain", "from_year": 2022, "to_year": None, "appearances": 80, "goals": 4},
        ],
        "transfers": [],
    },
]

# Manager tenure: which club, which years
MANAGER_TENURES = [
    {"manager": "Pep Guardiola", "club": "FC Barcelona", "from_year": 2008, "to_year": 2012},
    {"manager": "Pep Guardiola", "club": "Bayern Munich", "from_year": 2013, "to_year": 2016},
    {"manager": "Pep Guardiola", "club": "Manchester City", "from_year": 2016, "to_year": None},
    {"manager": "Jurgen Klopp", "club": "Borussia Dortmund", "from_year": 2008, "to_year": 2015},
    {"manager": "Jurgen Klopp", "club": "Liverpool", "from_year": 2015, "to_year": 2024},
    {"manager": "Carlo Ancelotti", "club": "Juventus", "from_year": 2001, "to_year": 2003},
    {"manager": "Carlo Ancelotti", "club": "AC Milan", "from_year": 2001, "to_year": 2009},
    {"manager": "Carlo Ancelotti", "club": "Real Madrid", "from_year": 2013, "to_year": 2015},
    {"manager": "Carlo Ancelotti", "club": "Bayern Munich", "from_year": 2016, "to_year": 2017},
    {"manager": "Carlo Ancelotti", "club": "Real Madrid", "from_year": 2021, "to_year": None},
    {"manager": "Xavi Hernandez", "club": "FC Barcelona", "from_year": 2021, "to_year": 2024},
    {"manager": "Erik ten Hag", "club": "Manchester United", "from_year": 2022, "to_year": 2024},
    {"manager": "Thomas Tuchel", "club": "Chelsea", "from_year": 2021, "to_year": 2022},
    {"manager": "Thomas Tuchel", "club": "Bayern Munich", "from_year": 2023, "to_year": 2024},
    {"manager": "Mikel Arteta", "club": "Arsenal", "from_year": 2019, "to_year": None},
]

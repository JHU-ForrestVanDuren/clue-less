INSERT INTO players_Cards (value, type)
SELECT "Mr. Green", "Character"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Mr. Green'
);

INSERT INTO players_Cards (value, type)
SELECT "Colonel Mustard", "Character"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Colonel Mustard'
);

INSERT INTO players_Cards (value, type)
SELECT "Professor Plum", "Character"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Professor Plum'
);

INSERT INTO players_Cards (value, type)
SELECT "Mrs. Peacock", "Character"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Mrs. Peacock'
);

INSERT INTO players_Cards (value, type)
SELECT "Miss Scarlet", "Character"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Miss Scarlet'
);

INSERT INTO players_Cards (value, type)
SELECT "Mrs. White", "Character"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Mrs. White'
);

INSERT INTO players_Cards (value, type)
SELECT "Candlestick", "Weapon"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Candlestick'
);

INSERT INTO players_Cards (value, type)
SELECT "Rope", "Weapon"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Rope'
);

INSERT INTO players_Cards (value, type)
SELECT "Lead Pipe", "Weapon"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Lead Pipe'
);

INSERT INTO players_Cards (value, type)
SELECT "Knife", "Weapon"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Knife'
);

INSERT INTO players_Cards (value, type)
SELECT "Wrench", "Weapon"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Wrench'
);

INSERT INTO players_Cards (value, type)
SELECT "Revolver", "Weapon"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Revolver'
);

INSERT INTO players_Cards (value, type)
SELECT "Hall", "Room"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Hall'
);

INSERT INTO players_Cards (value, type)
SELECT "Study", "Room"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Study'
);

INSERT INTO players_Cards (value, type)
SELECT "Ballroom", "Room"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Ballroom'
);

INSERT INTO players_Cards (value, type)
SELECT "Billiards Room", "Room"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Billiards Room'
);

INSERT INTO players_Cards (value, type)
SELECT "Dining Room", "Room"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Dining Room'
);

INSERT INTO players_Cards (value, type)
SELECT "Kitchen", "Room"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Kitchen'
);

INSERT INTO players_Cards (value, type)
SELECT "Lounge", "Room"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Lounge'
);

INSERT INTO players_Cards (value, type)
SELECT "Conservatory", "Room"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Conservatory'
);

INSERT INTO players_Cards (value, type)
SELECT "Library", "Room"
WHERE NOT EXISTS (
    SELECT * FROM  players_Cards where value = 'Library'
);
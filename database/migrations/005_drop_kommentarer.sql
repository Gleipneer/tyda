-- Migration: Ta bort tabellen Kommentarer
-- Förenklad modell: Anvandare, Kategorier, Poster, Begrepp, PostBegrepp, AktivitetLogg
-- Ref: Bantningsanalys 2025-03-16

USE reflektionsarkiv;

DROP TABLE IF EXISTS Kommentarer;

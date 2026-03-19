-- Migration 015: Lösenord (hash) och admin-flagga på Anvandare
ALTER TABLE Anvandare
  ADD COLUMN LosenordHash VARCHAR(255) NULL AFTER Epost,
  ADD COLUMN ArAdmin TINYINT(1) NOT NULL DEFAULT 0 AFTER LosenordHash;

-- Befintliga demo-användare (bcrypt 12 rundor, genererade med passlib)
UPDATE Anvandare SET Epost = 'emilssonjoakim@gmail.com', Anvandarnamn = 'Joakim Emilsson',
  LosenordHash = '$2b$12$JsvVfxd4YURGKTxQhNzbW.Z8SZzWuQrk2AoIc4JcE0AyuMAR1pEr2', ArAdmin = 0
  WHERE AnvandarID = 1 OR Epost = 'joakim@example.com';

UPDATE Anvandare SET
  LosenordHash = '$2b$12$w0ybC1ULTmPbKFxzdt9TruV6Bw7IPpApx5UNKMXwiewtvAiAARz4K', ArAdmin = 0
  WHERE Epost = 'anna@example.com';

UPDATE Anvandare SET
  LosenordHash = '$2b$12$w0ybC1ULTmPbKFxzdt9TruV6Bw7IPpApx5UNKMXwiewtvAiAARz4K', ArAdmin = 0
  WHERE Epost = 'elias@example.com';

INSERT INTO Anvandare (Anvandarnamn, Epost, LosenordHash, ArAdmin)
SELECT 'Admin', 'admin@tyda.local', '$2b$12$Bgbobq7Syp3FZIzfrnU5OOjTw76.W3BfU5wYkOHoLyIoxJ0wHBWIG', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Anvandare WHERE Epost = 'admin@tyda.local');

UPDATE Anvandare SET LosenordHash = '$2b$12$w0ybC1ULTmPbKFxzdt9TruV6Bw7IPpApx5UNKMXwiewtvAiAARz4K', ArAdmin = 0
  WHERE LosenordHash IS NULL;

ALTER TABLE Anvandare MODIFY COLUMN LosenordHash VARCHAR(255) NOT NULL;

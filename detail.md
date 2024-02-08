Plateforme de Réservation de salle de conférence

Route : /reservation
Vérifie si la salle est disponible sinon renvoie une erreur
Si la salle est dispo enregistre dans la base de données (DynamoDB) et envoie une notification à l'utilisateur (SNS)
L'authentification avec Cognito.

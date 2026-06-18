export const S = {
  // App
  appName: 'Gradella',

  // Auth
  email: 'Email',
  password: 'Mot de passe',
  login: 'Se connecter',
  logout: 'Déconnexion',
  loginError: 'Email ou mot de passe incorrect.',
  loggingIn: 'Connexion…',

  // Nav
  navCalendar: 'Calendrier',
  navStock: 'Stock',
  navCustomers: 'Clients',

  // Roles
  roleOwner: 'Propriétaire',
  roleShop: 'Boutique',

  // Calendar
  months: [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
  ],
  weekdays: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
  noBookingsToday: 'Aucune réservation ce jour.',
  addBooking: 'Nouvelle réservation',

  // Booking status
  statusReserved: 'Réservé',
  statusPickedUp: 'Récupéré',
  statusReturned: 'Rendu',
  statusCancelled: 'Annulé',

  // New booking
  newBooking: 'Nouvelle réservation',
  selectDates: 'Dates',
  startDate: 'Date de début',
  endDate: 'Date de fin (exclusive)',
  selectItem: 'Article',
  noItemsAvailable: 'Aucun article disponible pour ces dates.',
  selectCustomer: 'Client',
  newCustomer: 'Nouveau client',
  customerName: 'Nom',
  customerPhone: 'Téléphone',
  customerNotes: 'Notes',
  price: 'Prix (DA)',
  profit: 'Bénéfice boutique (DA)',
  confirmBooking: 'Confirmer la réservation',
  bookingCreated: 'Réservation créée.',
  bookingConflict: 'Cet article est déjà réservé pour ces dates.',
  bookingError: 'Erreur lors de la réservation.',
  required: 'Champ requis.',
  endAfterStart: 'La date de fin doit être après la date de début.',

  // Booking detail
  bookingDetail: 'Détail réservation',
  customer: 'Client',
  item: 'Article',
  dates: 'Dates',
  paid: 'Payé',
  yes: 'Oui',
  no: 'Non',
  markPickedUp: 'Marquer récupéré + payé',
  markReturned: 'Marquer rendu',
  cancel: 'Annuler la réservation',
  confirmCancel: 'Annuler cette réservation ?',
  statusUpdated: 'Statut mis à jour.',
  back: '← Retour',

  // Stock
  stock: 'Stock',
  addItem: 'Ajouter un article',
  editItem: 'Modifier l\'article',
  itemName: 'Nom',
  itemSize: 'Taille',
  itemCategory: 'Catégorie',
  itemBasePrice: 'Prix de base (DA)',
  itemPhotoUrl: 'URL photo',
  save: 'Enregistrer',
  saving: 'Enregistrement…',
  itemSaved: 'Article enregistré.',

  // Customers
  customers: 'Clients',
  addCustomer: 'Ajouter un client',
  noCustomers: 'Aucun client enregistré.',
  noItems: 'Aucun article en stock.',
  phone: 'Téléphone',
  notes: 'Notes',

  // Generic
  loading: 'Chargement…',
  error: 'Une erreur est survenue.',
  close: 'Fermer',
  edit: 'Modifier',
  delete: 'Supprimer',
}

export function statusLabel(status) {
  return {
    reserved: S.statusReserved,
    picked_up: S.statusPickedUp,
    returned: S.statusReturned,
    cancelled: S.statusCancelled,
  }[status] ?? status
}

export function roleLabel(role) {
  return role === 'owner' ? S.roleOwner : S.roleShop
}

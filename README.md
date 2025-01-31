# Project: Printafile

## 📖 Inhoudsopgave
1. [Inleiding](#inleiding)
2. [Technologieën en afhankelijkheden](#technologieën-en-afhankelijkheden)
3. [WebSocket](#websocket)
4. [Gebruik](#gebruik)
5. [Auteurs](#auteurs)
6. [Licentie](#licentie)
7. [Contactinformatie](#contactinformatie)
8. [Roadmap](#roadmap)
9. [Andere Tools](#andere-tools)
10. [FAQ](#faq)
11. [Afsluiting](#afsluiting)

---

## ✨ Inleiding
Printafile is een webapplicatie waarmee studenten en medewerkers 3D-printers kunnen beheren en hun printopdrachten kunnen inplannen. De applicatie maakt gebruik van WebSockets voor real-time updates en bevat functionaliteiten zoals login, registratie, printerdetails en projectbeheer.

---

## 🛠 Technologieën en afhankelijkheden
Deze applicatie maakt gebruik van de volgende technologieën:
- **Frontend**: HTML, CSS (Bootstrap), JavaScript
- **Backend**: WebSockets voor real-time communicatie
- **Database**: Gebruikt WebSocket-query’s om data op te halen
- **Libraries**:
  - Bootstrap 5.3.3
  - FullCalendar.js voor de agenda
  - LineIcons en Bootstrap Icons voor visuele elementen

---

## 🔌 WebSocket
De applicatie maakt gebruik van een WebSocket-server om real-time communicatie mogelijk te maken. WebSockets worden gebruikt voor:
- **Authenticatie** (`login.js`, `register.js`)
- **Printerstatus ophalen** (`printer.js`)
- **Projectbeheer** (`project.js`)
- **Gebruikersbeheer** (`user.js`)
- **Filamentbeheer** (`filament.js`)
- **Planning ophalen** (`schedule.js`)

De WebSocket-server draait op `ws://145.49.146.40:5678`.

---

## 🖥 Gebruik
### Installatie
1. Clone de repository:
   ```sh
   git clone https://github.com/AdA-Informatica/printer-que-web
   ```
2. Zorg dat je een WebSocket-server hebt draaien.
3. Open `145.49.146.40/printer-que-web` in je browser.

### Functionaliteiten
- **Login en registratie**: Gebruikers kunnen inloggen en zich registreren via WebSocket-authenticatie.
- **Printerbeheer**: Overzicht van beschikbare 3D-printers en hun status.
- **Projectbeheer**: Gebruikers kunnen hun projecten beheren en inplannen.
- **Filamentbeheer**: Admins kunnen filamentverbruik bijhouden.

---

## 👥 Auteurs
- **Bas** 
- **Alex**

---

## 📜 Licentie
Dit project valt onder de [MIT-licentie](https://opensource.org/licenses/MIT).

---

## 📞 Contactinformatie
Heb je vragen of suggesties? Neem contact op via:
- Email: printafile@gmail.com
- Telefoon: 0642327488

---

## 🚀 Roadmap
Toekomstige uitbreidingen:
- **Meer printerondersteuning**: Mogelijkheid om meerdere printers tegelijk te beheren.
- **Push-notificaties**: Meldingen voor voltooide prints.
- **Meer authenticatierollen**: Beheerder en studentrollen met aparte rechten.

---

## 🔧 Andere Tools
Deze tools worden in het project gebruikt:
- **Bootstrap** voor styling
- **FullCalendar** voor de agendaweergave
- **WebSocket-client** voor real-time data

---

## ❓ FAQ
**1. Hoe reset ik mijn wachtwoord?**
Momenteel is er geen wachtwoord-resetoptie. Neem contact op met de beheerder.

**2. Werkt de applicatie ook op mobiel?**
Ja, dankzij Bootstrap is de applicatie responsive.

---

## 🔚 Afsluiting
Printafile is een krachtig hulpmiddel voor 3D-printbeheer. Wij staan open voor feedback en verbeteringen!

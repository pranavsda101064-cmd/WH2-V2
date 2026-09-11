# Where2 — App Store Metadata

## Where2 Rider

### App Name
Where2 — Tourist Rides

### Subtitle (30 chars max)
Sakleshpura ride-hailing

### Category
Primary: Travel
Secondary: Transportation

### Age Rating
4+ (no objectionable content)

### Short Description (170 chars)
Book tourist rides in Sakleshpura, Karnataka. Explore coffee estates, waterfalls, and hill stations with trusted local drivers.

### Full Description
Where2 is a tourist ride-hailing app built for exploring Sakleshpura and the Western Ghats region of Karnataka, India.

Whether you're visiting coffee estates, viewpoints, waterfalls, or heritage forts, Where2 connects you with trusted local drivers who know the hills.

**Features:**
- Book rides to popular tourist destinations in Sakleshpura
- Real-time driver tracking on an interactive map
- Upfront fare estimates before you ride
- Ride PIN verification for safety
- Trip sharing with friends and family
- SOS safety alerts
- Rate and tip your driver
- Save your favorite routes

**Popular Destinations:**
- Bisle Ghat Viewpoint
- Manjarabad Fort
- Hanbal Waterfall Trail
- Kukke Subrahmanya Temple
- Shanti Falls
- Coffee estate tours

**How It Works:**
1. Enter your pickup and drop-off locations
2. Choose your vehicle type (Sedan, SUV, Traveller, Premium)
3. Confirm your ride and payment method
4. Track your driver in real-time
5. Enjoy your trip through the Western Ghats!

Where2 is currently available in Sakleshpura, Hassan district, Karnataka.

### Keywords (100 chars max)
sakleshpura,rides,taxi,tourist,western ghats,karnataka,coffee,estate,travel,hill station

### Support URL
https://github.com/pranavsda101064-cmd/WH2-V2/issues

### Privacy Policy URL
https://where2-wdu6.onrender.com/api/legal/privacy

### Marketing URL (optional)
https://github.com/pranavsda101064-cmd/WH2-V2

---

## Where2 Driver

### App Name
Where2 Driver

### Subtitle (30 chars max)
Drive & earn in Sakleshpura

### Category
Primary: Transportation
Secondary: Navigation

### Age Rating
4+

### Short Description (170 chars)
Earn money driving tourists through Sakleshpura. Accept ride requests, navigate with maps, and track your earnings.

### Full Description
Where2 Driver is the companion app for drivers on the Where2 platform in Sakleshpura, Karnataka.

Accept ride requests from tourists exploring the Western Ghats. Navigate to pickup locations, complete trips, and track your earnings — all from one dashboard.

**Features:**
- Receive ride requests from nearby tourists
- Accept or decline requests with a single tap
- Turn-by-turn navigation to pickup and drop-off
- Real-time earnings tracking (daily, weekly)
- Ride history with fare details
- Driver profile and document management
- Vehicle registration
- Online/offline toggle

**Requirements:**
- Valid driving license
- Vehicle registration certificate
- PSV badge (commercial vehicle permit)
- Aadhaar and PAN for identity verification

**How It Works:**
1. Complete your driver profile and upload documents
2. Go online to receive ride requests
3. Accept a request and navigate to the rider
4. Verify the rider's PIN to start the trip
5. Complete the trip and earn money

Where2 Driver is currently available in Sakleshpura, Hassan district, Karnataka.

### Keywords (100 chars max)
driver,earn,sakleshpura,taxi,ride,earnings,navigate,tourist,western ghats,karnataka

### Support URL
https://github.com/pranavsda101064-cmd/WH2-V2/issues

### Privacy Policy URL
https://where2-wdu6.onrender.com/api/legal/privacy

---

## Screenshots Needed

### Rider App (required: 2-8 screenshots)
1. Home screen with search bar and quick routes
2. Map view with pickup/drop-off selection
3. Vehicle selection screen
4. Checkout with payment method selection
5. Ride tracking screen with driver on map
6. Rating screen after ride completion
7. Profile screen with stats

### Driver App (required: 2-8 screenshots)
1. Dashboard with ride request cards
2. Ride request with accept/decline buttons
3. Active ride navigation screen
4. Earnings summary screen
5. Profile with documents and vehicle info
6. Onboarding flow (document upload)

## Build & Submit Commands

```bash
# Build for Android (production)
cd apps/where2-rider && eas build --platform android --profile production
cd apps/where2-driver && eas build --platform android --profile production

# Submit to Play Store
cd apps/where2-rider && eas submit --platform android
cd apps/where2-driver && eas submit --platform android

# Build for iOS (production)
cd apps/where2-rider && eas build --platform ios --profile production
cd apps/where2-driver && eas build --platform ios --profile production

# Submit to App Store
cd apps/where2-rider && eas submit --platform ios
cd apps/where2-driver && eas submit --platform ios
```

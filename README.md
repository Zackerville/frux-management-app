# FRUX Factory Manangement application

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Application Architecture
```mermaid
flowchart LR
  subgraph Shopfloor["Shopfloor (Lines A–F)"]
    iPadA["iPad A (Line A)"]
    iPadB["iPad B (Line B)"]
    iPadC["iPad C (Line C)"]
    iPadD["iPad D (Line D)"]
    iPadE["iPad E (Line E)"]
    iPadF["iPad F (Line F)"]
  end

  subgraph Cloud["Cloud / Backend"]
    API["HTTP API (Node/Express)"]
    DB[("MySQL")]
    Admin["Web Admin"]
  end

  EAS["EAS Build/Update"]
  MDM["Apple Business Manager / MDM"]

  iPadA --> API
  iPadB --> API
  iPadC --> API
  iPadD --> API
  iPadE --> API
  iPadF --> API

  Admin --> API
  API --> DB

  EAS --> iPadA
  EAS --> iPadB
  EAS --> iPadC
  EAS --> iPadD
  EAS --> iPadE
  EAS --> iPadF

  MDM --> iPadA
  MDM --> iPadB
  MDM --> iPadC
  MDM --> iPadD
  MDM --> iPadE
  MDM --> iPadF


```


## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

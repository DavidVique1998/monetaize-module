import { config } from "./config";
import HighLevel, { LogLevel, MongoDBSessionStorage } from '@gohighlevel/api-client';

// Tipos inferidos de las respuestas del SDK
export interface GHLLocation {
  id: string;
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Permitir propiedades adicionales del SDK
}

/**
 * Clase que encapsula métodos de GHL con un locationId pre-configurado
 * Permite llamar métodos sin tener que pasar locationId cada vez
 */
export class GHLAppForLocation {
  private ghlApp: GHLApp;
  private locationId: string;

  constructor(ghlApp: GHLApp, locationId: string) {
    this.ghlApp = ghlApp;
    this.locationId = locationId;
  }

  /**
   * Obtener la location actual
   */
  public async getLocation(): Promise<GHLLocation> {
    return this.ghlApp.getLocation(this.locationId);
  }

  /**
   * Obtener un contacto por ID (usa el locationId configurado)
   */
  public async getContact(contactId: string): Promise<any> {
    return this.ghlApp.getContact(contactId, this.locationId);
  }

  /**
   * Obtener headers con el locationId configurado
   * Útil para llamadas directas al SDK
   */
  public getHeaders(): { locationId: string } {
    return { locationId: this.locationId };
  }

  /**
   * Obtener el SDK de HighLevel para llamadas directas
   * Útil cuando necesitas usar métodos del SDK que no están encapsulados
   */
  public getSDK(): HighLevel {
    return this.ghlApp.getSDK();
  }

  /**
   * Obtener el locationId configurado
   */
  public getLocationId(): string {
    return this.locationId;
  }
}

export class GHLApp {
  private static instance: GHLApp;
  private ghl: HighLevel;
  private sessionStorage: MongoDBSessionStorage;
  private isInitialized: boolean = false;

  private constructor() {
    // Usar clientId y clientSecret para OAuth flow
    // El SDK necesita sessionStorage para almacenar tokens OAuth
    // Usamos MongoDBSessionStorage para persistir tokens en MongoDB
    this.sessionStorage = new MongoDBSessionStorage(
      config.mongodb.url,
      config.mongodb.database,
      'application_sessions' // Nombre de la colección
    );
    
    this.ghl = new HighLevel({
      clientId: config.ghlApp.appId,
      clientSecret: config.ghlApp.apiSecret,
      sessionStorage: this.sessionStorage,
      logLevel: LogLevel.WARN
    });
    console.log('GHLApp initialized', config.ghlApp);
  }

  /**
   * Inicializar la conexión a MongoDB
   * Debe llamarse antes de usar el sessionStorage
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Inicializar la conexión a MongoDB
      await this.sessionStorage.init();
      this.isInitialized = true;
      console.log('MongoDB session storage initialized');
    } catch (error) {
      console.error('Error initializing MongoDB session storage:', error);
      throw error;
    }
  }

  /**
   * Verificar si está inicializado y inicializar si es necesario
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  public static getInstance(): GHLApp {
    if (!GHLApp.instance) {
      GHLApp.instance = new GHLApp();
    }
    return GHLApp.instance;
  }

  public static async forLocation(locationId: string): Promise<GHLAppForLocation> {
    const instance = GHLApp.getInstance();
    await instance.ensureInitialized();
    return instance.forLocation(locationId);
  }

  /**
   * Obtener la instancia del SDK de HighLevel
   * Útil para acceder a métodos del SDK como webhooks
   */
  public getSDK(): HighLevel {
    return this.ghl;
  }

  /**
   * Obtener el sessionStorage para operaciones directas
   * Útil para eliminar sesiones en eventos UNINSTALL
   */
  public getSessionStorage(): MongoDBSessionStorage {
    return this.sessionStorage;
  }

  /**
   * Crear un contexto de GHLApp con un locationId pre-configurado
   * Permite llamar métodos sin tener que pasar locationId cada vez
   * 
   * @example
   * const ghlApp = GHLApp.getInstance();
   * await ghlApp.ensureInitialized();
   * const ghl = ghlApp.forLocation(user.ghlLocationId);
   * const contact = await ghl.getContact(contactId); // No necesita pasar locationId
   * const location = await ghl.getLocation(); // Usa el locationId configurado
   */
  public forLocation(locationId: string): GHLAppForLocation {
    return new GHLAppForLocation(this, locationId);
  }

  /**
   * Obtener todas las locations instaladas de GoHighLevel
   * Usa el SDK oficial que maneja automáticamente los tokens y scopes
   */
  public async getLocations(): Promise<GHLLocation[]> {
    try {
      await this.ensureInitialized();

      // Usar el método oauth.getInstalledLocation del SDK según el ejemplo oficial
      const response = await this.ghl.oauth.getInstalledLocation({
        isInstalled: true,
        companyId: config.ghlApp.companyId,
        appId: config.ghlApp.appId,
      });
      
      // Mapear la respuesta del SDK a nuestro tipo GHLLocation
      return (response.locations || []).map((location: any) => ({
        id: location.locationId || location.id || '',
        name: location.name || '',
        address1: location.address1,
        address2: location.address2,
        city: location.city,
        state: location.state,
        postalCode: location.postalCode,
        country: location.country,
        phone: location.phone,
        email: location.email,
        website: location.website,
        timezone: location.timezone,
        createdAt: location.createdAt,
        updatedAt: location.updatedAt,
        ...location, // Incluir cualquier propiedad adicional
      })) as GHLLocation[];
    } catch (error) {
      console.error('Error fetching GHL locations:', error);
      throw new Error('Failed to fetch locations from GoHighLevel');
    }
  }

  /**
   * Obtener una location específica por ID
   */
  public async getLocation(locationId: string): Promise<GHLLocation> {
    try {
      await this.ensureInitialized();
      
      const response = await this.ghl.locations.getLocation({
        locationId
      });
      if (!response.location) {
        throw new Error('Location not found');
      }
      return response.location as GHLLocation;
    } catch (error) {
      console.error('Error fetching GHL location:', error);
      throw new Error('Failed to fetch location from GoHighLevel');
    }
  }

  /**
   * Obtener un contacto por ID
   * 
   * IMPORTANTE: Este método requiere locationId porque el endpoint getContact
   * del SDK no acepta locationId como parámetro en el body. El SDK necesita
   * el locationId para identificar qué token usar en MongoDB.
   * 
   * Los ejemplos oficiales de GHL no muestran esto porque asumen una sola
   * sesión activa, pero en una app multi-tenant siempre debemos pasarlo.
   */
  public async getContact(contactId: string, locationId: string): Promise<any> {
    try {
      await this.ensureInitialized();
      
      // Cuando el endpoint no acepta locationId como parámetro,
      // se debe pasar en los headers para que el SDK sepa qué token usar
      const response = await this.ghl.contacts.getContact(
        { contactId },
        {
          headers: {
            locationId: locationId  // ← Requerido en app multi-tenant
          }
        }
      );
      
      return response.contact;
    } catch (error) {
      console.error('Error fetching GHL contact:', error);
      throw new Error('Failed to fetch contact from GoHighLevel');
    }
  }


  /**
   * Obtener todas las sesiones almacenadas para esta aplicación
   * Útil para verificar qué sesiones están activas
   */
  public async getAllSessions(): Promise<any[]> {
    try {
      await this.ensureInitialized();
      return await this.sessionStorage.getSessionsByApplication();
    } catch (error) {
      console.error('Error getting all sessions:', error);
      throw error;
    }
  }

  /**
   * Obtener una sesión específica por resourceId (companyId o locationId)
   */
  public async getSession(resourceId: string): Promise<any | null> {
    try {
      await this.ensureInitialized();
      return await this.sessionStorage.getSession(resourceId);
    } catch (error) {
      console.error(`Error getting session for ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Verificar si existe una sesión para un companyId
   */
  public async hasCompanySession(companyId: string): Promise<boolean> {
    try {
      const session = await this.getSession(companyId);
      return session !== null && session.userType === 'Company';
    } catch (error) {
      console.error(`Error checking company session for ${companyId}:`, error);
      return false;
    }
  }

  /**
   * Verificar si existe una sesión para un locationId
   */
  public async hasLocationSession(locationId: string): Promise<boolean> {
    try {
      const session = await this.getSession(locationId);
      return session !== null && session.userType === 'Location';
    } catch (error) {
      console.error(`Error checking location session for ${locationId}:`, error);
      return false;
    }
  }

  /**
   * Obtener todas las sesiones de locations para un companyId específico
   */
  public async getLocationSessions(companyId: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      const allSessions = await this.sessionStorage.getSessionsByApplication();
      return allSessions.filter(
        (session: any) => 
          session.userType === 'Location' && 
          session.companyId === companyId
      );
    } catch (error) {
      console.error(`Error getting location sessions for company ${companyId}:`, error);
      throw error;
    }
  }

  /**
   * Cerrar la conexión a MongoDB
   * Útil para limpieza al cerrar la aplicación
   */
  public async disconnect(): Promise<void> {
    if (this.isInitialized && this.sessionStorage) {
      try {
        await this.sessionStorage.disconnect();
        this.isInitialized = false;
        console.log('MongoDB session storage disconnected');
      } catch (error) {
        console.error('Error disconnecting MongoDB session storage:', error);
      }
    }
  }
}
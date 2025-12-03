/**
 * Tipos para Knowledge Base en Retell AI
 * Basado en la documentación: https://docs.retellai.com/api-references/create-knowledge-base
 */

/**
 * Texto para agregar a la Knowledge Base
 */
export interface KnowledgeBaseText {
  /**
   * Texto a agregar
   */
  text: string;
  
  /**
   * Título del texto (opcional)
   */
  title?: string;
}

/**
 * Fuente de Knowledge Base
 */
export interface KnowledgeBaseSource {
  /**
   * Tipo de fuente
   */
  type: 'document' | 'url' | 'text';
  
  /**
   * ID de la fuente
   */
  source_id?: string;
  
  /**
   * Nombre del archivo (para documentos)
   */
  filename?: string;
  
  /**
   * URL del archivo (para documentos)
   */
  file_url?: string;
}

/**
 * Knowledge Base Response de Retell AI
 */
export interface KnowledgeBase {
  /**
   * ID único de la Knowledge Base
   */
  knowledge_base_id: string;
  
  /**
   * Nombre de la Knowledge Base (máximo 40 caracteres)
   */
  knowledge_base_name: string;
  
  /**
   * Estado de la Knowledge Base
   */
  status: 'in_progress' | 'complete' | 'error';
  
  /**
   * Fuentes de la Knowledge Base
   */
  knowledge_base_sources?: KnowledgeBaseSource[];
  
  /**
   * Si está habilitado el auto-refresh
   */
  enable_auto_refresh?: boolean;
  
  /**
   * Timestamp de última actualización (milisegundos desde epoch)
   */
  last_refreshed_timestamp?: number;
}

/**
 * Datos para crear una Knowledge Base
 */
export interface CreateKnowledgeBaseData {
  /**
   * Nombre de la Knowledge Base (requerido, < 40 caracteres)
   */
  knowledge_base_name: string;
  
  /**
   * Textos a agregar (opcional)
   */
  knowledge_base_texts?: KnowledgeBaseText[];
  
  /**
   * URLs a scrapear y agregar (opcional)
   */
  knowledge_base_urls?: string[];
  
  /**
   * Habilitar auto-refresh para URLs (opcional)
   */
  enable_auto_refresh?: boolean;
}

/**
 * Datos para actualizar una Knowledge Base
 */
export interface UpdateKnowledgeBaseData {
  /**
   * Nombre de la Knowledge Base
   */
  knowledge_base_name?: string;
  
  /**
   * Habilitar auto-refresh
   */
  enable_auto_refresh?: boolean;
}


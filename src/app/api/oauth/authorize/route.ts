import { NextRequest, NextResponse } from 'next/server';
import { GHLApp } from '@/lib/ghlApp';
import { config } from '@/lib/config';

/**
 * Endpoint para generar la URL de autorización OAuth
 * 
 * Este endpoint genera la URL de autorización de GoHighLevel que el usuario
 * debe visitar para autorizar la aplicación.
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener la instancia del SDK
    const ghlApp = GHLApp.getInstance();
    const ghl = ghlApp.getSDK();

    // Construir la URL de redirección
    const redirectUri = `${config.app.url}/api/oauth/callback`;
    
    // Scopes requeridos para la aplicación
    // Nota: Los scopes también se configuran en GHL Marketplace, pero es recomendable
    // especificarlos aquí para ser explícitos sobre los permisos solicitados
    const scopes = [
      'businesses.readonly',
      'businesses.write',
      'calendars.readonly',
      'calendars.write',
      'calendars/events.readonly',
      'calendars/events.write',
      'calendars/groups.readonly',
      'calendars/groups.write',
      'calendars/resources.readonly',
      'calendars/resources.write',
      'campaigns.readonly',
      'conversations.readonly',
      'conversations.write',
      'conversations/message.readonly',
      'conversations/message.write',
      'conversations/reports.readonly',
      'conversations/livechat.write',
      'contacts.readonly',
      'contacts.write',
      'objects/record.readonly',
      'objects/schema.write',
      'objects/schema.readonly',
      'objects/record.write',
      'associations.write',
      'associations.readonly',
      'associations/relation.readonly',
      'associations/relation.write',
      'courses.write',
      'courses.readonly',
      'forms.readonly',
      'forms.write',
      'invoices.readonly',
      'invoices.write',
      'invoices/schedule.readonly',
      'invoices/schedule.write',
      'conversation-ai.write',
      'conversation-ai.readonly',
      'knowledge-bases.readonly',
      'knowledge-bases.write',
      'voice-ai-agent-goals.write',
      'voice-ai-agent-goals.readonly',
      'voice-ai-agents.write',
      'voice-ai-agents.readonly',
      'voice-ai-dashboard.readonly',
      'documents_contracts_template/list.readonly',
      'documents_contracts_template/sendLink.write',
      'documents_contracts/sendLink.write',
      'documents_contracts/list.readonly',
      'numberpools.read',
      'phonenumbers.read',
      'twilioaccount.read',
      'marketplace-installer-details.readonly',
      'charges.write',
      'charges.readonly',
      'blogs/list.readonly',
      'blogs/posts.readonly',
      'blogs/author.readonly',
      'blogs/category.readonly',
      'blogs/post-update.write',
      'blogs/check-slug.readonly',
      'blogs/post.write',
      'wordpress.site.readonly',
      'emails/schedule.readonly',
      'emails/builder.readonly',
      'emails/builder.write',
      'workflows.readonly',
      'users.readonly',
      'surveys.readonly',
      'store/setting.write',
      'store/setting.readonly',
      'store/shipping.write',
      'store/shipping.readonly',
      'products/collection.write',
      'products/collection.readonly',
      'products/prices.write',
      'products/prices.readonly',
      'products.write',
      'products.readonly',
      'payments/custom-provider.write',
      'payments/custom-provider.readonly',
      'payments/coupons.write',
      'payments/coupons.readonly',
      'payments/subscriptions.readonly',
      'payments/transactions.readonly',
      'payments/integration.write',
      'payments/integration.readonly',
      'payments/orders.collectPayment',
      'payments/orders.write',
      'payments/orders.readonly',
      'opportunities.write',
      'opportunities.readonly',
      'oauth.readonly',
      'oauth.write',
      'funnels/pagecount.readonly',
      'funnels/redirect.write',
      'funnels/funnel.readonly',
      'funnels/page.readonly',
      'funnels/redirect.readonly',
      'medias.write',
      'medias.readonly',
      'locations/tags.write',
      'locations/templates.readonly',
      'locations/tags.readonly',
      'recurring-tasks.write',
      'recurring-tasks.readonly',
      'locations/tasks.write',
      'locations/tasks.readonly',
      'locations/customFields.write',
      'locations/customFields.readonly',
      'locations/customValues.write',
      'locations/customValues.readonly',
      'locations.readonly',
      'links.write',
      'lc-email.readonly',
      'links.readonly',
      'invoices/estimate.write',
      'invoices/estimate.readonly',
      'invoices/template.write',
      'invoices/template.readonly',
      'socialplanner/oauth.readonly',
      'socialplanner/oauth.write',
      'socialplanner/post.readonly',
      'socialplanner/post.write',
      'socialplanner/account.readonly',
      'socialplanner/account.write',
      'socialplanner/csv.readonly',
      'socialplanner/csv.write',
      'socialplanner/category.readonly',
      'socialplanner/tag.readonly',
      'socialplanner/statistics.readonly',
      'socialplanner/tag.write',
      'socialplanner/category.write',
      'agent-studio.readonly',
      'agent-studio.write',
    ].join(' ');

    // Generar la URL de autorización usando el SDK
    const authorizationUrl = ghl.oauth.getAuthorizationUrl(
      config.ghlApp.appId,
      redirectUri,
      scopes
    );

    console.log('URL de autorización generada:', {
      redirectUri,
      scopes,
      appId: config.ghlApp.appId?.substring(0, 10) + '...'
    });

    return NextResponse.json({
      success: true,
      authorizationUrl,
      redirectUri,
      scopes
    });
  } catch (error) {
    console.error('Error generando URL de autorización:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}


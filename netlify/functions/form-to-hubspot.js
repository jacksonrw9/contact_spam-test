// netlify/functions/form-to-hubspot.js

exports.handler = async (event, context) => {
  console.log('Function triggered with method:', event.httpMethod);
  
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the webhook payload from Netlify Forms
    const payload = JSON.parse(event.body);
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));
    
    // Extract the form data
    // Netlify sends form data in the 'data' object
    const formData = payload.data || {};
    
    // Map Netlify form fields to HubSpot fields
    const hubspotFields = [];
    
    // Required fields
    if (formData.firstName) {
      hubspotFields.push({ name: "firstname", value: formData.firstName });
    }
    if (formData.lastName) {
      hubspotFields.push({ name: "lastname", value: formData.lastName });
    }
    if (formData.email) {
      hubspotFields.push({ name: "email", value: formData.email });
    }
    if (formData.companyName) {
      hubspotFields.push({ name: "company", value: formData.companyName });
    }
    
    // Optional fields
    if (formData.phoneNumber) {
      hubspotFields.push({ name: "phone", value: formData.phoneNumber });
    }
    if (formData.message) {
      hubspotFields.push({ name: "message", value: formData.message });
    }
    
    // Marketing consent
    if (formData.communications === "yes") {
      // Add any HubSpot field for marketing consent if you have one
      // hubspotFields.push({ name: "marketing_consent_field", value: true });
    }
    
    // Add static fields
    hubspotFields.push(
      { name: "hs_lead_status", value: "NEW" },
      { name: "lifecyclestage", value: "lead" }
    );

    console.log('Prepared HubSpot fields:', JSON.stringify(hubspotFields, null, 2));

    // Prepare HubSpot submission
    const hubspotData = {
      fields: hubspotFields,
      context: {
        pageUri: formData.referrer || 'https://phizzle.com/contact',
        pageName: "Contact Form - Netlify"
      }
    };

    // Add IP address if available
    if (formData.ip) {
      hubspotData.context.ipAddress = formData.ip;
    }

    // Submit to HubSpot
    const hubspotResponse = await fetch(
      'https://api.hsforms.com/submissions/v3/integration/submit/8070371/5efde115-8a41-4e38-8176-4b121279ff42',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hubspotData)
      }
    );

    const hubspotResult = await hubspotResponse.json();
    console.log('HubSpot response:', hubspotResponse.status, JSON.stringify(hubspotResult, null, 2));

    if (!hubspotResponse.ok) {
      console.error('HubSpot submission failed:', hubspotResult);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'HubSpot submission failed', 
          details: hubspotResult 
        })
      };
    }

    console.log('Successfully submitted to HubSpot');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Form submitted successfully to HubSpot'
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Server error', 
        message: error.message 
      })
    };
  }
};
```

## 📁 Project Structure:
```
your-project/
├── index.html
├── thank-you.html
├── netlify.toml
└── netlify/
    └── functions/
        └── form-to-hubspot.js

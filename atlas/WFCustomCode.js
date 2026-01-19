const {name, loanAmount, address, loanPurpose, salesPrice } = inputData;

try {
  const geocodeUrl = 'https://api.geocodify.com/v2/geocode';
  // const name = "John Doe";
  // const address = '7998 Beacon St, Chino, CA 91708';
  const geocodeApiKey = '2tszcKeMN5UozfQjsHay32oXsTNClW2M';

  const fullGeocodeUrl = `${geocodeUrl}?api_key=${geocodeApiKey}&q=${encodeURIComponent(address)}`;

  const geocodeHeaders = {
    'Authorization': '4f80a92947da8b39c724bbf0e8b0ceac7b310607b52966fc6001073ad6d87905',
    'Content-Type': 'application/json'
  };

  const geoResponse = await customRequest.get(fullGeocodeUrl, { headers: geocodeHeaders });

  if (
    geoResponse &&
    geoResponse.data &&
    geoResponse.data.response &&
    Array.isArray(geoResponse.data.response.features) &&
    geoResponse.data.response.features.length > 0
  ) {
    const props = geoResponse.data.response.features[0].properties;
    const state = props.region_a;
    const countyRaw = props.county || '';
    const county = countyRaw.replace(/ County$/i, '');
    const loanPurposeCode = loanPurpose && loanPurpose.toLowerCase().includes('purchase') ? 1 : 0;

    if (state && county) {
      // const loanAmount = 500000;
      const cleanLoanAmount = Math.round(Number(loanAmount)) || 0;
      const priorPolicyAmount = 0;
      const rateUrl = `http://www.atlastitleco.com/wp-json/wp/v2/ratecalculator?state=${state}&county=${encodeURIComponent(county)}&transactionType=${loanPurposeCode}&serviceType=0&loanAmount=${cleanLoanAmount}&priorPolicyAmount=${priorPolicyAmount}&originalAmount=0&totalPayoffAmount=0&recordingDate=2025-07-14&outstandingPrincipalBalance=0&salesPrice=${salesPrice}`;

      const rateHeaders = {
        'Authorization': '20898b2d8f20776e5e4007967f026ad381689cad4e569cd91eefc8a6ec3e333e'
      };

      const rateResponse = await customRequest.get(rateUrl, { headers: rateHeaders });

      const titleCharges = rateResponse.data && rateResponse.data.titleCharges;
      const settlementEscrowCharges = rateResponse.data && rateResponse.data.settlementEscrowCharges;
      const recordingFees = rateResponse.data && rateResponse.data.recordingFees;
      
      const insurance = titleCharges && titleCharges.lendersTitleInsurance ? parseFloat(titleCharges.lendersTitleInsurance.toFixed(2)) : 0;
      const escrow = settlementEscrowCharges && settlementEscrowCharges.closingFee ? parseFloat(settlementEscrowCharges.closingFee.toFixed(2)) : 0;
      const recording = recordingFees && recordingFees.recordingFee ? parseFloat(recordingFees.recordingFee.toFixed(2)) : 0;
      const affordable = recordingFees && recordingFees.affordableHousingAct ? parseFloat(recordingFees.affordableHousingAct.toFixed(2)) : 0;
      
      const total = parseFloat((insurance + escrow + recording + affordable).toFixed(2));
      
      
      const pdfPayload = {
        name: name,
        address: address,
        state: state,
        county: county,
        loanAmount: cleanLoanAmount,
        insurance,
        escrow,
        recording,
        affordable,
        total,
        transactionType:loanPurpose,
        serviceType: "Title and Escrow"
      };

      const pdfApiUrl = 'https://script.google.com/macros/s/AKfycby_zRG7XXooHbtBVKtZ9Jk2Cslco9aIu9WozVdZtKcgyV28ibZMxoY_HZZKtCbvMIMm/exec';

      const queryString = Object.entries(pdfPayload)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      const pdfResponse = await customRequest.get(`${pdfApiUrl}?${queryString}`);

      return {
        success: true,
        state,
        county,
        pdfUrl: pdfResponse.data.pdfUrl || pdfResponse.data.url || null
      };
    } else {
      return {
        success: false,
        error: 'Missing state or county from geocoding response',
        state,
        county
      };
    }
  } else {
    return {
      success: false,
      error: 'No valid geocoding data found',
      raw: geoResponse
    };
  }

} catch (error) {
  return {
    success: false,
    error: 'An error occurred during the API requests',
    message: error && error.message ? error.message : error,
    stack: error && error.stack ? error.stack : null
  };
}

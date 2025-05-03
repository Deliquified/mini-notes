export const uploadMetadataToIPFS = async (metadata: any) => {
    try {
      // Log the data being sent to IPFS for debugging
      console.log("📦 Metadata being uploaded to IPFS:", JSON.stringify(metadata));
      
      const formData = new FormData();
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], 'metadata.json', { type: 'application/json' });
      formData.append('file', metadataFile);

      const response = await fetch('/api/pinataPinFile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Pinata API error:", errorText);
        throw new Error('Failed to upload metadata to IPFS: ' + errorText);
      }

      const ipfsUrl = await response.json();
      console.log("🏆 Successfully uploaded to IPFS, response:", ipfsUrl);
      return ipfsUrl;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  };
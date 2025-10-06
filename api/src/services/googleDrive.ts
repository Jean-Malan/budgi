import { google } from 'googleapis'
import { DriveFolder, DriveFile } from '../types/shared'

class GoogleDriveService {
  private drive: any

  constructor() {
    // For now, we'll use a simple API key approach
    // Later we can implement OAuth2 for user-specific access
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    })

    this.drive = google.drive({ version: 'v3', auth })
  }

  async getFolderContents(folderId: string): Promise<DriveFile[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id,name,size,modifiedTime,mimeType)',
        orderBy: 'modifiedTime desc'
      })

      return response.data.files || []
    } catch (error) {
      console.error('Error fetching folder contents:', error)
      throw new Error('Failed to fetch Google Drive folder contents')
    }
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media'
      }, { responseType: 'arraybuffer' })

      return Buffer.from(response.data)
    } catch (error) {
      console.error('Error downloading file:', error)
      throw new Error('Failed to download file from Google Drive')
    }
  }

  async searchFolders(query: string): Promise<DriveFolder[]> {
    try {
      const response = await this.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name contains '${query}' and trashed=false`,
        fields: 'files(id,name,webViewLink)',
        pageSize: 10
      })

      return response.data.files || []
    } catch (error) {
      console.error('Error searching folders:', error)
      throw new Error('Failed to search Google Drive folders')
    }
  }
}

export const googleDriveService = new GoogleDriveService()
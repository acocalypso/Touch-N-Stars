import Foundation
import Capacitor
import Photos

@objc(PhotoLibrarySaver)
public class PhotoLibrarySaver: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PhotoLibrarySaver"
    public let jsName = "PhotoLibrarySaver"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveImage", returnType: CAPPluginReturnPromise)
    ]

    @objc func saveImage(_ call: CAPPluginCall) {
        guard let base64String = call.getString("base64") else {
            print("[PhotoLibrarySaver] Error: base64 string is required")
            call.reject("base64 string is required")
            return
        }

        let albumName = call.getString("albumName") ?? "TouchNStars"
        print("[PhotoLibrarySaver] Starting save process for album: \(albumName)")
        print("[PhotoLibrarySaver] Base64 string length: \(base64String.count)")

        // Remove data URL prefix if present
        let base64Data = base64String.replacingOccurrences(of: "data:image/jpeg;base64,", with: "")
            .replacingOccurrences(of: "data:image/jpg;base64,", with: "")
            .replacingOccurrences(of: "data:image/png;base64,", with: "")

        print("[PhotoLibrarySaver] Cleaned base64 length: \(base64Data.count)")

        guard let imageData = Data(base64Encoded: base64Data, options: .ignoreUnknownCharacters),
              let image = UIImage(data: imageData) else {
            print("[PhotoLibrarySaver] Error: Failed to decode base64 to image")
            call.reject("Invalid base64 image data - failed to decode")
            return
        }

        print("[PhotoLibrarySaver] Image decoded successfully. Size: \(image.size)")

        // Request photo library permissions
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            print("[PhotoLibrarySaver] Permission status: \(status.rawValue)")

            guard status == .authorized || status == .limited else {
                let statusDescription: String
                switch status {
                case .denied:
                    statusDescription = "denied"
                case .restricted:
                    statusDescription = "restricted"
                case .notDetermined:
                    statusDescription = "not determined"
                default:
                    statusDescription = "unknown"
                }

                print("[PhotoLibrarySaver] Error: Permission \(statusDescription)")
                call.reject("Photo library permission not granted. Status: \(statusDescription). Please enable photo access in Settings.")
                return
            }

            print("[PhotoLibrarySaver] Permission granted, proceeding to save")

            // Save to specific album
            self.saveImageToAlbum(image: image, albumName: albumName) { success, error in
                if success {
                    print("[PhotoLibrarySaver] Success: Image saved to album")
                    call.resolve([
                        "success": true,
                        "message": "Image saved to \(albumName) album"
                    ])
                } else {
                    print("[PhotoLibrarySaver] Error: Failed to save - \(error ?? "unknown")")
                    call.reject(error ?? "Failed to save image to album")
                }
            }
        }
    }

    private func saveImageToAlbum(image: UIImage, albumName: String, completion: @escaping (Bool, String?) -> Void) {
        print("[PhotoLibrarySaver] Fetching or creating album: \(albumName)")

        // Find or create album
        fetchAlbum(withName: albumName) { album in
            if album != nil {
                print("[PhotoLibrarySaver] Album found/created, saving image")
            } else {
                print("[PhotoLibrarySaver] Warning: Could not get album reference, saving to camera roll only")
            }

            PHPhotoLibrary.shared().performChanges({
                let createRequest = PHAssetCreationRequest.creationRequestForAsset(from: image)

                if let album = album {
                    let addAssetRequest = PHAssetCollectionChangeRequest(for: album)
                    addAssetRequest?.addAssets([createRequest.placeholderForCreatedAsset!] as NSArray)
                    print("[PhotoLibrarySaver] Image will be added to album and camera roll")
                } else {
                    print("[PhotoLibrarySaver] Image will be added to camera roll only")
                }
            }, completionHandler: { success, error in
                DispatchQueue.main.async {
                    if success {
                        print("[PhotoLibrarySaver] Photo library changes committed successfully")
                        completion(true, nil)
                    } else {
                        let errorMsg = error?.localizedDescription ?? "Unknown error"
                        print("[PhotoLibrarySaver] Photo library changes failed: \(errorMsg)")
                        completion(false, errorMsg)
                    }
                }
            })
        }
    }

    private func fetchAlbum(withName name: String, completion: @escaping (PHAssetCollection?) -> Void) {
        print("[PhotoLibrarySaver] Searching for album: \(name)")
        let fetchOptions = PHFetchOptions()
        fetchOptions.predicate = NSPredicate(format: "title = %@", name)
        let collections = PHAssetCollection.fetchAssetCollections(with: .album, subtype: .any, options: fetchOptions)

        if let album = collections.firstObject {
            print("[PhotoLibrarySaver] Album '\(name)' found with \(album.estimatedAssetCount) photos")
            completion(album)
        } else {
            print("[PhotoLibrarySaver] Album '\(name)' not found, creating new album")
            // Create new album
            var albumPlaceholder: PHObjectPlaceholder?
            PHPhotoLibrary.shared().performChanges({
                let createAlbumRequest = PHAssetCollectionChangeRequest.creationRequestForAssetCollection(withTitle: name)
                albumPlaceholder = createAlbumRequest.placeholderForCreatedAssetCollection
            }, completionHandler: { success, error in
                if success, let placeholder = albumPlaceholder {
                    print("[PhotoLibrarySaver] Album '\(name)' created successfully")
                    let collections = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [placeholder.localIdentifier], options: nil)
                    completion(collections.firstObject)
                } else {
                    let errorMsg = error?.localizedDescription ?? "Unknown error"
                    print("[PhotoLibrarySaver] Failed to create album: \(errorMsg)")
                    completion(nil)
                }
            })
        }
    }
}

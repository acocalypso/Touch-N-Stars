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
            call.reject("base64 string is required")
            return
        }

        let albumName = call.getString("albumName") ?? "TouchNStars"

        // Remove data URL prefix if present
        let base64Data = base64String.replacingOccurrences(of: "data:image/jpeg;base64,", with: "")
            .replacingOccurrences(of: "data:image/jpg;base64,", with: "")
            .replacingOccurrences(of: "data:image/png;base64,", with: "")

        guard let imageData = Data(base64Encoded: base64Data, options: .ignoreUnknownCharacters),
              let image = UIImage(data: imageData) else {
            call.reject("Invalid base64 image data")
            return
        }

        // Request photo library permissions
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            guard status == .authorized || status == .limited else {
                call.reject("Photo library permission not granted")
                return
            }

            // Save to specific album
            self.saveImageToAlbum(image: image, albumName: albumName) { success, error in
                if success {
                    call.resolve([
                        "success": true,
                        "message": "Image saved to \(albumName) album"
                    ])
                } else {
                    call.reject(error ?? "Failed to save image")
                }
            }
        }
    }

    private func saveImageToAlbum(image: UIImage, albumName: String, completion: @escaping (Bool, String?) -> Void) {
        // Find or create album
        fetchAlbum(withName: albumName) { album in
            PHPhotoLibrary.shared().performChanges({
                let createRequest = PHAssetCreationRequest.creationRequestForAsset(from: image)

                if let album = album {
                    let addAssetRequest = PHAssetCollectionChangeRequest(for: album)
                    addAssetRequest?.addAssets([createRequest.placeholderForCreatedAsset!] as NSArray)
                }
            }, completionHandler: { success, error in
                DispatchQueue.main.async {
                    if success {
                        completion(true, nil)
                    } else {
                        completion(false, error?.localizedDescription ?? "Unknown error")
                    }
                }
            })
        }
    }

    private func fetchAlbum(withName name: String, completion: @escaping (PHAssetCollection?) -> Void) {
        let fetchOptions = PHFetchOptions()
        fetchOptions.predicate = NSPredicate(format: "title = %@", name)
        let collections = PHAssetCollection.fetchAssetCollections(with: .album, subtype: .any, options: fetchOptions)

        if let album = collections.firstObject {
            completion(album)
        } else {
            // Create new album
            var albumPlaceholder: PHObjectPlaceholder?
            PHPhotoLibrary.shared().performChanges({
                let createAlbumRequest = PHAssetCollectionChangeRequest.creationRequestForAssetCollection(withTitle: name)
                albumPlaceholder = createAlbumRequest.placeholderForCreatedAssetCollection
            }, completionHandler: { success, error in
                if success, let placeholder = albumPlaceholder {
                    let collections = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [placeholder.localIdentifier], options: nil)
                    completion(collections.firstObject)
                } else {
                    completion(nil)
                }
            })
        }
    }
}

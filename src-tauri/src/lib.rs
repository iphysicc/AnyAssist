// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Manager, Emitter};

#[tauri::command]
fn greet() -> String {
  let now = SystemTime::now();
  let epoch_ms = now.duration_since(UNIX_EPOCH).unwrap().as_millis();
  format!("Hello world from Rust! Current epoch: {}", epoch_ms)
}

#[tauri::command]
async fn check_update(window: tauri::Window) -> Result<String, String> {
  use tauri_plugin_updater::UpdaterExt;
  match window.app_handle().updater().unwrap().check().await {
    Ok(Some(update)) => {
      // Güncelleme mevcut
      let update_info = serde_json::json!({
        "version": update.version,
        "date": update.date.map(|d| d.to_string()).unwrap_or_default(),
        "body": update.body.unwrap_or_default(),
        "available": true
      });
      Ok(serde_json::to_string(&update_info).map_err(|e| e.to_string())?)
    }
    Ok(None) => {
      // Güncelleme mevcut değil
      Err("No updates available".to_string())
    }
    Err(e) => Err(format!("Error checking for updates: {}", e)),
  }
}

#[tauri::command]
async fn install_update(window: tauri::Window) -> Result<(), String> {
  use tauri_plugin_updater::UpdaterExt;

  // Önce güncelleme kontrolü yap
  let update_result = window.app_handle().updater().unwrap().check().await;

  match update_result {
    Ok(Some(update)) => {
      // İlerleme durumu için callback - İlerleme durumunu bir olay olarak gönder
      let window_clone = window.clone();
      let progress_handler = move |downloaded, total| {
        let progress = if let Some(total_size) = total {
          if total_size > 0 {
            (downloaded as f64 / total_size as f64) * 100.0
          } else {
            0.0
          }
        } else {
          0.0 // Total bilinmiyorsa ilerleme 0
        };
        
        // İlerleme durumunu bir olay olarak gönder
        let _ = window_clone.emit("tauri://update-status", serde_json::json!({
          "status": "DOWNLOADING",
          "progress": progress
        }));
      };

      // İndirme tamamlandığında callback
      let window_clone = window.clone();
      let done_handler = move || {
        // İndirme tamamlandı olayını gönder
        let _ = window_clone.emit("tauri://update-status", serde_json::json!({
          "status": "DONE", 
          "progress": 100
        }));
      };

      // Güncellemeyi indir ve kur
      match update.download_and_install(
        progress_handler,
        done_handler
      ).await {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Error installing update: {}", e)),
      }
    }
    Ok(None) => Err("No updates available to install".to_string()),
    Err(e) => Err(format!("Error checking for updates: {}", e)),
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![greet, check_update, install_update])
    .setup(|app| {
      #[cfg(desktop)]
      {
        let window = app.get_webview_window("main").unwrap();
        // Özel başlık çubuğu kullanmak için varsayılan dekorasyonları kaldır
        window.set_decorations(false)?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

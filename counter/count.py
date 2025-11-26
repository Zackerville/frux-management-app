import os
import yaml
import numpy as np
import cv2
from datetime import datetime
import threading
import time
import queue
import mysql.connector

BACKEND_URL = 'https://127.0.0.1:3000/auto_count'

MYSQL_CONFIG = {
    'host': '34.97.183.142',
    'port': 3306,
    'user': 'FruxAdmin',
    'password': 'Fruxadmin#2025',
    'database': 'FRUX',
}

VIDEO_SOURCES = {
    0: "Camera 1 (ID 0)",
    1: "Camera 2 (ID 1)",
    2: "Camera 3 (ID 2)",
    3: "Camera 4 (ID 3)",
    4: "Camera 5 (ID 4)",
    5: "Camera 6 (ID 5)",
}

CAMERA_TABLE_MAP = {
    "Camera 1 (ID 0)": "Aライン生産データ",
    "Camera 2 (ID 1)": "Bライン生産データ",
    "Camera 3 (ID 2)": "Cライン生産データ",
    "Camera 4 (ID 3)": "Dライン生産データ",
    "Camera 5 (ID 4)": "Eライン生産データ",
    "Camera 6 (ID 5)": "Fライン生産データ",
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
fn_yaml = os.path.join("data.yaml")

config = {'save_video': False,
          'text_overlay': True,
          'object_overlay': True,
          'object_id_overlay': False,
          'object_detection': True,
          'min_area_motion_contour': 60,
          'park_sec_to_wait': 0.1,
          'start_frame': 0}

stop_event = threading.Event()

frame_queue = queue.Queue(maxsize=40) 
DISPLAY_WINDOW_SIZE = (480,360)

def log_count_to_mysql(camera_name, total_count, ppm, timestamp):
    """
    Save total_count in 自動数.
    """
    table_name = CAMERA_TABLE_MAP.get(camera_name)
    
    if not table_name:
        print(f"[MySQL Log] ERROR: Camera name '{camera_name}' not found in CAMERA_TABLE_MAP.")
        return

    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG) 
        cursor = conn.cursor()

        cursor.execute(f"""
                       SELECT 商品コード
                       FROM {table_name}
                       WHERE 開始時刻 IS NOT NULL AND 終了時刻 IS NULL
                       ORDER BY 商品コード DESC
                       LIMIT 1
                       """)
        row = cursor.fetchone()
        
        if not row:
            print(f'No active task in {table_name}')
            return
        
        task_id = row[0]
        cursor.execute(f"""
                       UPDATE {table_name}
                       SET 自動数 = %s WHERE 商品コード = %s
                       """, (total_count, task_id))
        conn.commit()
        
        if cursor.rowcount == 0:
             print(f"[MySQL Log] WARNING: No rows updated in {table_name}. Task ID not found.")
        else:
             print(f"[MySQL Log] Updated {table_name}. Set 自動数 = {total_count} successfully.")

    except mysql.connector.Error as err:
        print(f"[MySQL Error] Failed to update data in {table_name}: {err}")
    except Exception as e:
        print(f"[General Error] Log function error: {e}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()

def load_yaml_data(fn_yaml):
    """Loading data of file YAML."""
    try:
        with open(fn_yaml, 'r') as stream:
            object_area_data = yaml.safe_load(stream)
            if not object_area_data:
                print(f"Warning: File YAML '{fn_yaml}' Empty or Not found data of countting area.")
                return [], []
    except FileNotFoundError:
        print(f"Error: Not Found file YAML: {fn_yaml}")
        return [], []
    except Exception as e:
        print(f"Error reading YAML file: {e}")
        return [], []
        
    object_bounding_rects = []
    
    for park in object_area_data:
        points = np.array(park['points'], dtype=np.int32)
        rect = cv2.boundingRect(points)
        object_bounding_rects.append(rect)
            
    print(f"ROI area: {len(object_area_data)}")
    return object_area_data, object_bounding_rects

object_area_data, object_bounding_rects = load_yaml_data(fn_yaml)

class CameraWorker(threading.Thread):
    def __init__(self, camera_id, camera_name, object_area_data, object_bounding_rects, stop_event, frame_queue):
        super().__init__()
        self.camera_id = camera_id
        self.camera_name = camera_name
        self.object_area_data = object_area_data
        self.object_bounding_rects = object_bounding_rects
        self.stop_event = stop_event
        self.frame_queue = frame_queue
        
    def run(self):
        cap = cv2.VideoCapture(self.camera_id)
        if not cap.isOpened():
            print(f"Can't Open Camera {self.camera_id} ({self.camera_name}). Passed this thread.")
            return

        print(f"Camera Opening {self.camera_name} (ID: {self.camera_id})")
        
        start_time_cam = datetime.now()
        last_time_cam = datetime.now()
        ct_cam = 0.0
        ppm_cam = 0.0
        total_output_cam = 0 
        fastest_cam = 0.0
        ppm_average_cam = 0.0

        object_status = [False] * len(self.object_area_data)
        object_buffer = [None] * len(self.object_area_data)

        while cap.isOpened() and not self.stop_event.is_set(): 
            try:
                ret, frame = cap.read() 
                
                if ret is False or frame is None:
                    time.sleep(0.1)
                    if cap.get(cv2.CAP_PROP_FRAME_COUNT) > 0 and cap.get(cv2.CAP_PROP_POS_FRAMES) >= cap.get(cv2.CAP_PROP_FRAME_COUNT):
                        break 
                    continue

                video_cur_pos = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0 
                frame_out = frame.copy()
                
                frame_blur = cv2.GaussianBlur(frame.copy(), (5,5), 3)
                frame_gray = cv2.cvtColor(frame_blur, cv2.COLOR_BGR2GRAY)

                if config['object_detection']: 
                    for ind, park in enumerate(self.object_area_data):
                        rect = self.object_bounding_rects[ind]
                        roi_gray = frame_gray[rect[1]:(rect[1]+rect[3]), rect[0]:(rect[0]+rect[2])] 
                        
                        if roi_gray.size > 0:
                            status = np.std(roi_gray) < 20 and np.mean(roi_gray) > 56
                        else:
                            status = object_status[ind]

                        if status != object_status[ind]:
                            if object_buffer[ind] is None: 
                                object_buffer[ind] = video_cur_pos
                            elif video_cur_pos - object_buffer[ind] > config['park_sec_to_wait']:
                                if status == False:
                                    total_output_cam += 1
                                    
                                    current_time = datetime.now()
                                    diff = current_time - last_time_cam 
                                    ct_cam = diff.total_seconds()
                                    ppm_cam = round(60 / ct_cam, 2) if ct_cam > 0 else 0.0
                                    last_time_cam = current_time

                                    diff_total = current_time - start_time_cam
                                    minutes = diff_total.total_seconds() / 60
                                    ppm_average_cam = round(total_output_cam / minutes, 2) if minutes > 0 else 0.0

                                    if (ppm_cam > fastest_cam):
                                        fastest_cam = ppm_cam

                                    print(f"[{self.camera_name}] Count* {total_output_cam}, PPM: {ppm_cam:.2f}, Avg PPM: {ppm_average_cam:.2f}")
                                    log_count_to_mysql(self.camera_name, total_output_cam, ppm_cam, current_time)

                                object_status[ind] = status
                                object_buffer[ind] = None 
                        elif status == object_status[ind] and object_buffer[ind] is not None:
                            object_buffer[ind] = None 

                if config['object_overlay']: 
                    for ind, park in enumerate(self.object_area_data):
                        points = np.array(park['points'], dtype=np.int32)
                        
                        color = (0,255,0) if object_status[ind] else (0,0,255)
                        
                        cv2.drawContours(frame_out, [points], contourIdx=-1,color=color, thickness=2, lineType=cv2.LINE_8) 

                        if config['object_id_overlay']:
                            moments = cv2.moments(points)
                            if moments['m00'] != 0:
                                centroid = (int(moments['m10']/moments['m00']), int(moments['m01']/moments['m00']))
                                cv2.putText(frame_out, str(park['id']), centroid, cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0,0,0), 1, cv2.LINE_AA)

                if config['text_overlay']:
                    cv2.rectangle(frame_out, (1, 5), (350, 90),(0,255,0), 2)
                    cv2.putText(frame_out, f"CAMERA: {self.camera_name} (ID: {self.camera_id})", (5,20), cv2.FONT_HERSHEY_SIMPLEX ,0.5, (255,0,0), 2, cv2.LINE_AA)
                    cv2.putText(frame_out, f"Total Counting = {total_output_cam}, Speed (PPM) = {ppm_cam:.2f}", (5,40), cv2.FONT_HERSHEY_SIMPLEX ,0.5, (0,0,255), 2, cv2.LINE_AA)
                    cv2.putText(frame_out, f"Fastest PPM: {fastest_cam:.2f}, Average: {ppm_average_cam:.2f}", (5,60), cv2.FONT_HERSHEY_SIMPLEX ,0.5, (255,255,0), 1, cv2.LINE_AA)
                    cv2.putText(frame_out, f"Last CT (s): {ct_cam:.2f}", (5,80), cv2.FONT_HERSHEY_SIMPLEX ,0.5, (255,255,0), 1, cv2.LINE_AA)
                
                try:
                    self.frame_queue.put((self.camera_name, frame_out), timeout=0.01)
                except queue.Full:
                    pass

            except Exception as e:
                print(f"Camera Error {self.camera_name}: {e}")
                break
            
            time.sleep(0.001)

        cap.release()
        print(f"Camera {self.camera_name} Stopped. Final Count: {total_output_cam}")

if __name__ == '__main__':

    if not object_area_data:
        print("Not found data of ROI, System can't be start. Log Out.")
        exit()
        
    threads = []

    for camera_id, camera_name in VIDEO_SOURCES.items():
        t = CameraWorker(camera_id, camera_name, object_area_data, object_bounding_rects, stop_event, frame_queue)
        threads.append(t)
        t.start()

    print("Camera Systems Start. Press 'q' or ESC to exit.")
    
    try:
        while not stop_event.is_set():
            try:
                camera_name, frame_out = frame_queue.get(timeout=0.001) 
                
                imS = cv2.resize(frame_out, (480, 360))
                cv2.imshow(f'Output Counting - {camera_name}', imS)
                
            except queue.Empty:
                pass
            
            k = cv2.waitKey(1)
            if k == ord('q') or k == 27:
                stop_event.set()

    except KeyboardInterrupt:
        stop_event.set()
    except Exception as e:
        print(f"Main Loop Error: {e}")
        stop_event.set()

    print("Shutting Down Camera...")

    for t in threads:
        t.join(timeout=5)

    cv2.destroyAllWindows()
    print("Shutdown Systems.")
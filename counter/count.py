# -*- coding: utf-8 -*-

import yaml
import numpy as np
import cv2
from datetime import datetime
import threading
import time

VIDEO_SOURCE_1 = 1
VIDEO_SOURCE_2 = 2 
VIDEO_SOURCE_3 = 3 
VIDEO_SOURCE_4 = 4 
VIDEO_SOURCE_5 = 5
VIDEO_SOURCE_6 = 6

path = "../output/"

fn_yaml = r"/datasets/area.yml" 
config = {'save_video': False,
          'text_overlay': True,
          'object_overlay': True,
          'object_id_overlay': False,
          'object_detection': True,
          'min_area_motion_contour': 60,
          'park_sec_to_wait': 0.001,
          'start_frame': 0}

data_lock = threading.Lock() 

def load_yaml_data(fn_yaml):
    """Tải và xử lý dữ liệu vùng đếm từ file YAML."""
    try:
        with open(fn_yaml, 'r') as stream:
            object_area_data = yaml.safe_load(stream)
            if not object_area_data:
                print(f"Warnning: File YAML '{fn_yaml}' rỗng hoặc không có dữ liệu vùng đếm.")
                return [], []
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file YAML tại đường dẫn: {fn_yaml}")
        return [], []
    except Exception as e:
        print(f"Error : file YAML: {e}")
        return [], []
        
    object_bounding_rects = []
    
    for park in object_area_data:
        points = np.array(park['points'])
        rect = cv2.boundingRect(points)
        object_bounding_rects.append(rect)
            
    print(f"Số lượng vùng ROI được tải: {len(object_area_data)}")
    return object_area_data, object_bounding_rects

object_area_data, object_bounding_rects = load_yaml_data(fn_yaml)

def camera_processing_thread(camera_id, camera_name, object_area_data, object_bounding_rects):
    """
    Hàm xử lý video độc lập cho từng camera.
    Tất cả các biến đếm và thời gian đều là CỤC BỘ.
    """
    
    cap = cv2.VideoCapture(camera_id)
    if not cap.isOpened():
        print(f"Can't Open Camera {camera_id} ({camera_name}). Đã bỏ qua luồng này.")
        return

    start_time_cam = datetime.now()
    last_time_cam = datetime.now()
    
    ct_cam = 0.0
    ppm_cam = 0.0
    total_output_cam = 0 
    fastest_cam = 0.0
    ppm_average_cam = 0.0
    qty_cam = 0
    rec_qty_cam = 1 

    object_status = [False] * len(object_area_data)
    object_buffer = [None] * len(object_area_data)

    print (f"Camera Openning {camera_name} (ID: {camera_id})")
    
    while(cap.isOpened()): 
        try:
            video_cur_pos = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0 
            ret, frame = cap.read() 
            
            if ret == False:
                time.sleep(0.1) 
                continue 

            frame_blur = cv2.GaussianBlur(frame.copy(), (5,5), 3)
            frame_gray = cv2.cvtColor(frame_blur, cv2.COLOR_BGR2GRAY)
            frame_out = frame.copy()

            if config['object_detection']: 
                for ind, park in enumerate(object_area_data):
                    rect = object_bounding_rects[ind]
                    roi_gray = frame_gray[rect[1]:(rect[1]+rect[3]), rect[0]:(rect[0]+rect[2])] 
                    status = np.std(roi_gray) < 20 and np.mean(roi_gray) > 56

                    if status != object_status[ind] and object_buffer[ind] == None: 
                        object_buffer[ind] = video_cur_pos

                    elif status != object_status[ind] and object_buffer[ind] != None:
                        if video_cur_pos - object_buffer[ind] > config['park_sec_to_wait']:
                            if status==False:
                                # ===============================================================
                                qty_cam += 1
                                total_output_cam += 1
                                
                                current_time = datetime.now()
                                diff = current_time - last_time_cam 
                                ct_cam = diff.total_seconds()
                                
                                if ct_cam > 0:
                                    ppm_cam = round(60 / ct_cam, 2)
                                else:
                                    ppm_cam = 0.0
                                    
                                last_time_cam = current_time

                                diff_total = current_time - start_time_cam
                                minutes = diff_total.total_seconds() / 60
                                
                                if minutes > 0:
                                    ppm_average_cam = round(total_output_cam / minutes, 2)
                                else:
                                    ppm_average_cam = 0.0

                                data = (camera_name, current_time.strftime('%Y%m%d %H%M%S.%f'), total_output_cam, minutes, ppm_average_cam, ct_cam, ppm_cam)

                                with data_lock:
                                    if (ppm_cam > fastest_cam):
                                        fastest_cam = ppm_cam
                                        
                                    if (qty_cam > rec_qty_cam):
                                        qty_cam = 0

                                # ===============================================================
                            
                            object_status[ind] = status
                            object_buffer[ind] = None 
                    
                    elif status == object_status[ind] and object_buffer[ind]!=None:
                        object_buffer[ind] = None 

            if config['object_overlay']: 
                for ind, park in enumerate(object_area_data):
                    points = np.array(park['points'])

                    color = (0,255,0) if object_status[ind] else (0,0,255)
                    
                    cv2.drawContours(frame_out, [points], contourIdx=-1,color=color, thickness=2, lineType=cv2.LINE_8) 

                    if config['object_id_overlay']:
                        moments = cv2.moments(points)    
                        if moments['m00'] != 0:
                            centroid = (int(moments['m10'] / moments['m00'])-3, int(moments['m01']/moments['m00'])+3)
                            cv2.putText(frame_out, str(park['id']), centroid, cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0,0,0), 1, cv2.LINE_AA)

            if config['text_overlay']:
                display_total_output = total_output_cam
                display_ppm = ppm_cam
                display_fastest = fastest_cam
                display_ppm_average = ppm_average_cam
                
                cv2.rectangle(frame_out, (1, 5), (350, 90),(0,255,0), 2)
                cv2.putText(frame_out, f"CAMERA: {camera_name} (ID: {camera_id})", (5,20), cv2.FONT_HERSHEY_SIMPLEX ,0.5, (255,0,0), 2, cv2.LINE_AA)
                str_on_frame = "Total Counting = %d, Speed (PPM) = %.2f" % (display_total_output, display_ppm)
                cv2.putText(frame_out, str_on_frame, (5,40), cv2.FONT_HERSHEY_SIMPLEX ,0.5, (0,0,255), 2, cv2.LINE_AA)
                str_on_frame = "Fastest PPM: %.2f, Average: %.2f" % (display_fastest, display_ppm_average)
                cv2.putText(frame_out, str_on_frame, (5,60), cv2.FONT_HERSHEY_SIMPLEX ,0.5, (255,255,0), 1, cv2.LINE_AA)
                str_on_frame = "Last CT (s): %.2f" % ct_cam
                cv2.putText(frame_out, str_on_frame, (5,80), cv2.FONT_HERSHEY_SIMPLEX ,0.5, (255,255,0), 1, cv2.LINE_AA)


            imS = cv2.resize(frame_out, (480,360))
            cv2.imshow(f'Output Counting - {camera_name}', imS)
            cv2.waitKey(1)
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Camera Error {camera_name}: {e}")
            break

    cap.release()
    print(f"Camera {camera_name} Stopped. Final Count: {total_output_cam}")

if __name__ == '__main__':

    thread_cam1 = threading.Thread(target=camera_processing_thread, args=(VIDEO_SOURCE_1, "Camera 1", object_area_data, object_bounding_rects))
    thread_cam2 = threading.Thread(target=camera_processing_thread, args=(VIDEO_SOURCE_2, "Camera 2", object_area_data, object_bounding_rects))
    thread_cam3 = threading.Thread(target=camera_processing_thread, args=(VIDEO_SOURCE_3, "Camera 3", object_area_data, object_bounding_rects))
    thread_cam4 = threading.Thread(target=camera_processing_thread, args=(VIDEO_SOURCE_4, "Camera 4", object_area_data, object_bounding_rects))
    thread_cam5 = threading.Thread(target=camera_processing_thread, args=(VIDEO_SOURCE_5, "Camera 5", object_area_data, object_bounding_rects))
    thread_cam6 = threading.Thread(target=camera_processing_thread, args=(VIDEO_SOURCE_6, "Camera 6", object_area_data, object_bounding_rects))

    thread_cam1.start()
    thread_cam2.start()
    thread_cam3.start()
    thread_cam4.start()
    thread_cam5.start()
    thread_cam6.start()

    try:
        while True:
            k = cv2.waitKey(1)
            if k == ord('q'):
                break
            time.sleep(0.1) 
    except KeyboardInterrupt:
        pass

    print("Shutting Down Camera...")

    thread_cam1.join(timeout=2)
    thread_cam2.join(timeout=2)
    thread_cam3.join(timeout=2)
    thread_cam4.join(timeout=2)
    thread_cam5.join(timeout=2)
    thread_cam6.join(timeout=2)

    cv2.destroyAllWindows()
    print("Shutdown Systems.")
# 우분투 서버에 올리기

## 1. 웹서버(nginx)와 비밀번호 도구 설치
```
sudo apt update
sudo apt install -y nginx apache2-utils
```

## 2. 파일 올리기
내 PC에서 받은 `epson-calc.tar.gz` 를 서버로 복사한 뒤 (예: `scp epson-calc.tar.gz 사용자@서버주소:~`), 서버에서:
```
sudo mkdir -p /var/www/epson-calc
sudo tar -xzf ~/epson-calc.tar.gz -C /var/www/epson-calc
```

## 3. 직원용 아이디/비밀번호 만들기
```
sudo htpasswd -c /etc/nginx/.htpasswd-epson staff
```
(비밀번호를 두 번 입력. 계정을 더 만들 때는 `-c` 없이 실행)

## 4. nginx 설정 적용
```
sudo cp nginx-epson-calc.conf /etc/nginx/sites-available/epson-calc
sudo ln -s /etc/nginx/sites-available/epson-calc /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```
`nginx -t` 에서 `syntax is ok` 가 나와야 합니다.

## 5. 방화벽 (ufw 를 쓰는 경우)
```
sudo ufw allow 'Nginx HTTP'
```

## 6. 접속
브라우저에서 `http://서버주소/` → 아이디/비밀번호 입력 → 계산기 화면

## 수정본 반영
새 `epson-calc.tar.gz` 를 받아 2번만 다시 실행하면 됩니다.

## 참고
- 도메인이 있으면 HTTPS 를 권장합니다: `sudo apt install -y certbot python3-certbot-nginx && sudo certbot --nginx`
- 비밀번호 보호를 빼면 링크를 아는 누구나 볼 수 있습니다. 엡손 사양서 데이터가 들어 있으므로 회사 밖 공개는 권장하지 않습니다.

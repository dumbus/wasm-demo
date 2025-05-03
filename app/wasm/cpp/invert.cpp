#include <emscripten.h>
#include <stdio.h>

extern "C" {

  #pragma pack(push, 1)
  struct BMPHeader {
    uint16_t signature;
    uint32_t fileSize;
    uint32_t reserved;
    uint32_t dataOffset;
    uint32_t headerSize;
    int32_t width;
    int32_t height;
    uint16_t planes;
    uint16_t bitsPerPixel;
  };
  #pragma pack(pop)

  EMSCRIPTEN_KEEPALIVE
  void analyze_image(unsigned char* data, int length) {
    printf("Received image with %d bytes\n", length);

    BMPHeader* header = reinterpret_cast<BMPHeader*>(data);

    // Первые 2 байта должны содержать BM - сигнатуру BMP-файла
    if (header->signature != 0x4D42) {
      printf("Not a valid BMP file\n");
      fflush(stdout);
      return;
    }

    if (header->bitsPerPixel != 24) {
      printf("Only 24-bit BMP files are supported\n");
      fflush(stdout);
      return;
    }

    printf("BMP File Info:\n");
    printf("Width: %d pixels\n", header->width);
    printf("Height: %d pixels\n", header->height);
    printf("Bits per pixel: %d\n", header->bitsPerPixel);
    printf("Data starts at offset: %u bytes\n", header->dataOffset);
    fflush(stdout);
  }

  EMSCRIPTEN_KEEPALIVE
  void invert_colors(uint8_t* data) {
    BMPHeader* header = reinterpret_cast<BMPHeader*>(data);

    uint32_t pixelDataOffset = header->dataOffset;
    int width = header->width;
    int height = header->height;
    int rowSize = (width * 3 + 3) & (~3); // Выравнивание строк до кратного 4 байтам

    for (int i = 0; i < 100; ++i) {
      for (int y = 0; y < height; ++y) {
        uint8_t* row = data + pixelDataOffset + y * rowSize;
        for (int x = 0; x < width; ++x) {
          uint8_t* pixel = row + x * 3;
          pixel[0] = 255 - pixel[0]; // Blue
          pixel[1] = 255 - pixel[1]; // Green
          pixel[2] = 255 - pixel[2]; // Red
        }
      }

      printf("Image colors inverted ... times");
    }

    fflush(stdout);
  }

}
